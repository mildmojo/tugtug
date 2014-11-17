#pragma strict

import System.Collections.Generic;
import System.Linq;
import MiniJSON;

class River {
	var stepMinAngle : float;
	var stepMaxAngle : float;
	var stickiness : float;
	var length : int;
	
	var seed : float;
	var points : List.<Vector3>;

	public function River() {}
	
	public function River(json : String) {
		River();

		var params = Json.Deserialize(json) as Dictionary.<String, Object>;
		stepMinAngle = params["stepMinAngle"];
		stepMaxAngle = params["stepMaxAngle"];
		stickiness = params["stickiness"];
		length = params["length"];
		seed = params["seed"];
	}
	
	public function River(walkMinAngle : float, walkMaxAngle : float, stickyChance : float, riverLength : int) {
		stepMinAngle = walkMinAngle;
		stepMaxAngle = walkMaxAngle;
		stickiness = stickyChance;
		length = riverLength;
	}

	public function SetParams(stepMinAngle : float, stepMaxAngle : float, sticky: float, rlen: int) {
		stepMinAngle = stepMinAngle;
		stepMaxAngle = stepMaxAngle;
		stickiness = sticky;
		length = rlen;
	}
	
	function Regenerate() {
		Generate(seed);
	}
	
	function Generate() {
		Generate(Random.Range(0, 256000));
	}
	
	function Generate(newSeed : float) {
		// Randomize!
		seed = newSeed;
		Random.seed = seed;
		
		// Start at origin.
		points = new List.<Vector3>();
		points.Add(Vector3.zero);
		
		// Create increment vector and use it to calculate the first point from origin.
		var lastAngle = 0;
		var lastVector = Vector3(0,0,1);
		var lastPoint = lastVector;
		points.Add(lastVector);

		for (var i = 0; i < length - 1; i++) {
			var angle : float;
			if (Random.value > stickiness) {
				angle = Random.Range(stepMinAngle, stepMaxAngle);
				angle = Random.value > 0.5 ? -angle : angle;
			} else {
				angle = lastAngle;
			}
			
			var newVector = Quaternion.AngleAxis(angle, Vector3.up) * lastVector;
			var newPoint = lastPoint + newVector;
			
			// If path crosses itself, back up and try this section again.
			for (var ptIdx = 0; ptIdx < points.Count - 20; ptIdx++) {
				if ((points[ptIdx] - newPoint).sqrMagnitude < newVector.sqrMagnitude * 5) {
					var retryLength = Mathf.Min(points.Count, 35);

					i -= retryLength;
					points.RemoveRange(points.Count - retryLength, retryLength);
					
					lastVector = points[points.Count - 1] - points[points.Count - 2];
					lastPoint = points[points.Count - 1];
					
					newVector = Quaternion.AngleAxis(angle, Vector3.up) * lastVector;
					newPoint = lastPoint + newVector;
					
					break;
				}
			}
			
			points.Add(newPoint);

			lastVector = newVector;
			lastPoint = newPoint;
			lastAngle = angle;
		}
	}
	
	function ToJSON() : String {
		var attrs = {
			"stepMinAngle": stepMinAngle,
			"stepMaxAngle": stepMaxAngle,
			"stickiness": stickiness,
			"length": length,
			"seed": seed
		};
		
		return Json.Serialize(attrs);	
	}
	
	function ToBoundingBox() : BoundingBox {
		return new BoundingBox(points);
	}
	
	class BoundingBox {
		var min : Vector3;
		var max : Vector3;
		var center : Vector3;
		var size: Vector3;
		
		function BoundingBox(points : List.<Vector3>) {
			min = points[0];
			max = points[0];
			
			for (var pt : Vector3 in points) {
				min.x = Mathf.Min(min.x, pt.x);
				min.y = Mathf.Min(min.y, pt.y);
				min.z = Mathf.Min(min.z, pt.z);
				
				max.x = Mathf.Max(max.x, pt.x);
				max.y = Mathf.Max(max.y, pt.y);
				max.z = Mathf.Max(max.z, pt.z);
			}
			
			size = max - min;
			center = min + (max - min) / 2; //Vector3((max.x - min.x) / 2, (max.y - min.y) / 2, (max.z - min.z) / 2);
		}
	}
}