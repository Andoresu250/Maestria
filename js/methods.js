VARIATIONS = {}
VARIATIONS[1] =  { alfa_1: 1, alfa_2: 0, m: 1, lambda: 1 };
VARIATIONS[2] =  { alfa_1: 1, alfa_2: 0, m: 1, lambda: 2 };
VARIATIONS[3] =  { alfa_1: 0, alfa_2: 1, m: 1, lambda: 1 };
VARIATIONS[4] =  { alfa_1: 0, alfa_2: 1, m: 1, lambda: 2 };

function trimSpaces(s){	
	s = s.replace(/(^\s*)|(\s*$)/gi,"");
	s = s.replace(/[ ]{2,}/gi," ");
	s = s.replace(/\n /,"\n");
	return s;
}

function calculateDistance(nodeA, nodeB) {
	return Math.sqrt((nodeA.x - nodeB.x)*(nodeA.x - nodeB.x) + (nodeA.y - nodeB.y)*(nodeA.y - nodeB.y));
}

function calculateDistances(nodes){
	for(nodeA of nodes){
		for(nodeB of nodes){
			if(nodeA.id !== nodeB.id){									
				nodeA.distances[nodeB.id] = calculateDistance(nodeA, nodeB);				
			}
		}	
	}
}

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function loadNodes(nodes) {
	thisNodes = [];	
	for(node of nodes){
		var newNode = {
			id: 			node.id,
			x: 				node.x,
			y: 				node.y,
			demand: 		node.demand,
			ready_time: 	node.ready_time,
			due_time: 		node.due_time,
			service_time: 	node.service_time,
			distances:      {}
		}
		thisNodes.push(newNode);
	}	
	calculateDistances(thisNodes);
	return thisNodes;
}

function findNode(nodes,id){	
	for (var i = 0; i < nodes.length; i++) {		
		if(nodes[i].id == id){
			return nodes[i];
		}
	}	
	console.log("Nodo no encontrado... LMAO");
	return null;
}

function removeNodeFromArray(nodes,node){
	for (var i = 0; i < nodes.length; i++) {
		if(nodes[i].id === node.id){
			return nodes.splice(i,1);			
		}
	}
	console.log("Nodo no borrado... LMAOOO");
	return null;
}

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

function createRoutes(){
	var routes = [];
	for (var criterion = 1; criterion <= 4; criterion++) {
		console.log("creando rutas criterion_1 con criterios #" + criterion);
		routesManager.routes["criterion_1"][criterion] = generateRoutes(1, criterion);
		console.log("creando rutas criterion_2 con criterios #" + criterion);
		routesManager.routes["criterion_2"][criterion] = generateRoutes(2, criterion);
	}	
}

function generateRoutes(seed, criterion){
	var routes = [];
	var unvisited_copy = clone(nodeManeger.unvisited);
	var route_original = initRoute(seed, capacity);	
	do{		
		var unvisited = clone(nodeManeger.unvisited);		
		var new_route = node_added = null;
		var max_c2 = -999999999999;		
		for(node of unvisited){
			for (var position = 1; position <= route_original.route.length - 1; position++) {
				var alternative_route = clone(route_original);
				alternative_route.route = clone(route_original.route);
				alternative_route.demand = capacity;
				alternative_route.arrival_time = alternative_route.wait_time = alternative_route.services_time = alternative_route.total_distance = alternative_route.total_service_time = 0;				
				if( insert_node(alternative_route, node, position)){
					var c2 = calculate_c2(node, position, route_original, criterion, alternative_route);
					console.log("c2: " + c2);
					if(c2 >= max_c2){
						max_c2 = c2;
						new_route = clone(alternative_route);
						new_route.route = clone(alternative_route.route);
						node_added = node;
					}
				}
				nodeManeger.unvisited = clone(unvisited);
			}
		}

		if(new_route === null){
			routes.push(route_original);
			route_original = initRoute(seed, capacity);	
			if(nodeManeger.unvisited.length === 0){
				routes.push(route_original);
			}
		}else{
			route_original = clone(new_route);
			route_original.route = clone(new_route.route);
			nodeManeger.unvisited = clone(unvisited);
			removeNodeFromArray(nodeManeger, node_added);
			delete nodeManeger.origin.distancesTemp[node_added.id];
			if(nodeManeger.unvisited.length === 0){
				console.log("NOO init route generateROutes:");			
				console.log(route_to_s(route_original));
				routes.push(route_original);
			}
		}
		console.log(".");
	} while(!(nodeManeger.unvisited.length === 0));

	nodeManeger.unvisited = unvisited_copy;
	nodeManeger.origin.distancesTemp = clone(nodeManeger.origin.distances);
	return routes;
}

function total_distance(criterion, variables){
	var cri = criterion === 1 ? "criterion_1" : "criterion_2";
	var sum = 0;
	for(var route of routesManager.routes[cri][variables]){
		sum += route.total_distance;
	}
	return sum;
}

function add(route, node, _position = -1){		
	var node_added = node.id === nodeManeger.origin.id ? nodeManeger.origin : removeNodeFromArray(nodeManeger.unvisited, node)[0];
	if(_position === -1){		
		route.route.push(node_added);
	}else{
		route.route.splice(_position, 0, node_added);
	}		
}

function seed(criterion, route){
	switch(criterion){
		case 1:
			add(route, criterion_1());
			break;
		case 2:
			add(route, criterion_2());
			break;
	}
}

function calculate_values(node_i, node_j, route){
	var values = {};	
	var wik = node_i.id === nodeManeger.origin.id ? node_i.ready_time : route.services_time;
	var distance = node_i.distances[node_j.id];	
	values["arrival_time"] = wik + node_i.service_time + distance;	
	var wait_time = ready_time(node_j, values["arrival_time"]);	
	var demand = route.demand - node_i.demand;

	console.log("wik: " + wik);
	console.log("route.services_time: " + route.services_time);
	console.log("node_i.ready_time: " + node_i.ready_time);
	console.log("distace: " + distance);
	console.log("node_i.service_time: " + node_i.service_time);
	console.log("service time node: " + node_i.service_time);	
	console.log("arrival_time: " + values["arrival_time"]);
	console.log("wait_time: " + wait_time);
	console.log("demand: " + demand);

	if(wait_time !== null && demand >= 0){
		values["distance"] = distance;
		values["wait_time"] = wait_time;
		values["services_time"] = values["arrival_time"] + wait_time;
		values["total_service_time"] = node_i.service_time;
		route.demand = demand;		
		return values;
	}else{		
		return false;
	}
}

function insert_node(route, node, position){
	add(route, node, position);
	for(var split of split_routes(route)){
		var values = calculate_values(split[0], split[1], route);		
		if(values){
			assign_values(values, route);
			return true;
		}else{
			return false;
		}
	}
}

function initRoute(criterion, capacity, _sw = false){	
	var route = {
		route: 				[],
		arrival_time: 		0,
		wait_time: 			0,
		services_time: 		0,
		total_distance: 	0,
		total_service_time: 0,
		demand: 			capacity
	};
	add(route, nodeManeger.origin);
	seed(criterion, route);		
	add(route, nodeManeger.origin);	
	for(var split of split_routes(route)){
		var values = calculate_values(split[0], split[1], route);
		if(values){
			assign_values(values, route);
		}		
	}	
	if(_sw){
		console.log("spooky route: ");
		console.log(route);
	}
	return route;
}

function criterion_1(){
	var node = max_node(nodeManeger.origin);
	delete nodeManeger.origin.distancesTemp[node.id];
	return node;
}

function criterion_2(){
	return min_time();
}

function max_node(node){
	var maxNode = Object.keys(node.distancesTemp)[0];
	var maxDistance = node.distancesTemp[maxNode];
	for(key of Object.keys(node.distancesTemp)){
		if(node.distancesTemp[maxNode] < node.distancesTemp[key]){
			maxNode = key;
			maxDistance = node.distancesTemp[key];
		}
	}	
	return findNode(nodeManeger.nodes, maxNode);
}

function min_time(){
	return nodeManeger.unvisited[0];
}

function split_routes(route){
	var route_pairs = [];
	console.log(route);
	for (var i = 0; i <= route.route.length - 2; i++) {
		route_pairs.push([route.route[i], route.route[i+1]]);
	}
	return route_pairs;
}

function assign_values(values, route){
	route.arrival_time = values["arrival_time"];
	route.total_distance += values["total_distance"];
	route.wait_time += values["wait_time"];
	route.services_time = values["services_time"];
	route.total_service_time += values["total_service_time"];
}

function calculate_c2(node, position_node, original_route, constant, route){

	var previous_node = route.route[position_node - 1];
	var next_node = route.route[position_node + 1];

	var c11 = previous_node.distances[node.id] + node.distances[next_node.id] - VARIATIONS[constant]["m"] * previous_node.distances[next_node.id];

	var route_original_c12 = original_route.route.slice(0, position_node);
	var route_alternative_c12 = route.route.slice(0, position_node + 1);	

	var copy_original = clone(original_route);
	reset_attributes(copy_original);
	var copy_alternative = clone(route);
	reset_attributes(copy_alternative);

	for(var split of split_routes(route_original_c12)){
		assign_values(calculate_values(split[0], split[1], copy_original), copy_original);		
	}
	for(var split of split_routes(route_alternative_c12)){
		assign_values(calculate_values(split[0], split[1], copy_alternative), copy_alternative);		
	}	

	var c12 = copy_alternative.services_time - copy_original.services_time;
	var c1 = (VARIATIONS[constant]["alfa_1"] * c11) + (VARIATIONS[constant]["alfa_2"] * c12);
	return (VARIATIONS[constant]["lambda"] * nodeManeger.origin.distances[node.id]) - c1; 
}

function ready_time(node_j, arrival_time){	
	if(arrival_time < node_j.ready_time){
		return node_j.ready_time - arrival_time;
	}else{
		if(arrival_time >= node_j.ready_time && arrival_time <= node_j.due_time){
			return 0;
		}else{
			return null;
		}
	}
}

function reset_attributes(route){
	route.arrival_time = route.wait_time = route.services_time = route.total_distance = route.total_service_time = 0;
	route.demand = capacity;
}

function route_to_s(route, _sw = false){
	if(_sw){
		console.log("to string");
		console.log(route);
	}
	var s = "[ ";
	for(var node of route.route){
		s += (node.id + 1) + " ";
	}
	s += " ]"
	return s;
}

function show_routes(){
	for (var criterion = 1; criterion <= 2; criterion++) {
		if(criterion === 1){
			console.log("Criterion 1");
			var key = "criterion_1";
		}else{
			console.log("Criterion 2");
			var key = "criterion_2";
		}
		for (var value = 1; value <= 4; value++) {
			console.log("α1 = " + VARIATIONS[value]["alfa_1"] + ", α2 = " + VARIATIONS[value]["alfa_2"] + ", μ = " + VARIATIONS[value]["m"] + ", λ = " + VARIATIONS[value]["lambda"]);
			console.log("Total distance: " + total_distance(criterion, value));
			console.log("\n");
			for (var i = 0; i < routesManager.routes[key][value].length; i++) {
				var route = routesManager.routes[key][value][i];
				console.log((i + 1) + ". 	" + route_to_s(route));
				console.log("   	" + "Distance: " + route.total_distance);	
				console.log("   	" + "Wait time: " + route.wait_time);	
				console.log("   	" + "Service time: " + route.service_time);	
				console.log("   	" + "Arrival time: " + route.arrival_time);	
				console.log("   	" + "Demand: " + (capacity - route.demand));	
			}
		}
	}
}