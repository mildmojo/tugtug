using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

public class GameManager : MonoBehaviour
{
	private const int MAX_PLAYERS = 2;

	public static bool P1 = false;
	public static bool P2 = false;

	public GameObject Water;

	public GameObject CheckpointPrefab;
	public int CheckpointFrequency = 1;

	public static float RespawnDropHeight = 10f;
	public static float RespawnVelocityPercentage = 0.4f;

	public List<GameObject> PlayerPrefabs = new List<GameObject>();

	public static List<GameObject> Players = new List<GameObject>();
	public static List<float> PlayerTimes = new List<float>();

	private static Dictionary<GameObject, List<int>> playerDistances = null;
	
	private bool playersSpawned = false;
	private Vector3 spawnPoint = Vector3.zero;
	private List<Vector3> riverPoints = null;
	private List<GameObject> checkpoints = null;
	private float waterElevation;

	public static void EnterCheckpoint(int id, GameObject player) {
//		Debug.Log("Entering Checkpoint!");
		if (!playerDistances.ContainsKey(player)) {
			playerDistances.Add(player, new List<int>());
		}
		// If only checkpoint ID is negative, it's the "last seen" checkpoint. Replace with the new one.
		if (playerDistances[player].Count == 1 && playerDistances[player].First() < 0) {
			playerDistances[player].Remove(playerDistances[player].First());
		}
		playerDistances[player].Add(id);
	}
	
	public static void ExitCheckpoint(int id, GameObject player) {
//		Debug.Log("Exiting Checkpoint!");
		if (!playerDistances.ContainsKey(player)) return;
		playerDistances[player].Remove(id);

		// If there are no more checkpoints in the list, add this one as a negative to mean "last seen".
		if (playerDistances[player].Count == 0) {
			playerDistances[player].Add(-id);
		}
	}

	public static List<GameObject> GetStandings() {
		if (playerDistances.Count > 0) {
			var standings = playerDistances
				.OrderByDescending(pair => 
					pair.Value.Select(distance => Mathf.Abs(distance)).Max()
				).Select(pair => pair.Key).ToList();
			return standings;
		} else {
			return null;
		}
	}

	public void Start()
	{
#if UNITY_EDITOR
		P1 = true;
#endif
		waterElevation = Water.transform.position.y;
	}

	void Update() {
		if (!playersSpawned && spawnPoint != Vector3.zero) {
			SpawnPlayers();
		}

		if (spawnPoint == Vector3.zero) {
			SendMessage("NextRiver");
		}

		foreach (var checkpoint in checkpoints) {
			var checkLoc = checkpoint.transform.position;
			checkpoint.transform.TransformPoint(new Vector3(checkLoc.x, waterElevation, checkLoc.z));
		}
	}

	// RiverManager will SendMessage to set start point. Because compilation order.
	public void SetSpawnPoint(Vector3 point) {
		spawnPoint = point;
	}
	
	// RiverManager will SendMessage to set river points. Because compilation order.
	public void SetRiverPoints(List<Vector3> points) {
		riverPoints = points;
		CreateCheckpoints();
	}

	private void SpawnPlayers() {
		playerDistances = new Dictionary<GameObject, List<int>>();

		// Instantiate.
		for (var i = 0; i < MAX_PLAYERS; i++) {
			var obj = Instantiate(PlayerPrefabs[i]) as GameObject;
			Players.Add(obj);
			PlayerTimes.Add(float.PositiveInfinity);
			playerDistances.Add(obj, new List<int> {0});
		}

		// Formation width is N boats plus N-1 boat-sized spaces.
		var formationWidth = 0f;
		foreach (var boat in Players) {
			formationWidth += 2 * boat.GetComponentInChildren<Collider>().bounds.size.x;
		}
		formationWidth -= Players.Last().GetComponentInChildren<Collider>().bounds.size.x;

		// Center formation by setting left-most point at formationWidth / 2 left of spawnPoint facing starting line.
		var formationLeft = Quaternion.AngleAxis(-90, Vector3.up) * (riverPoints.First() - spawnPoint);
		formationLeft = formationLeft.normalized * (formationWidth / 2);

		// Arrange.
		// This actually places boats left of center since positions are boat centers, not left edges.
		foreach (var boat in Players) {
			boat.transform.position = spawnPoint + formationLeft + Vector3.up * Water.transform.position.y;
			boat.transform.LookAt(riverPoints.First());
			var boatWidth = boat.GetComponentInChildren<Collider>().bounds.size.x;
			formationLeft = formationLeft.normalized * (formationWidth / 2 - boatWidth * 2);
		}

		playersSpawned = true;
	}

	private void CreateCheckpoints() {
		checkpoints = CreateAlong(riverPoints, CheckpointPrefab, CheckpointFrequency, waterElevation);
		
		for (var i = 0; i < checkpoints.Count; i++) {
			var scale = checkpoints[i].transform.localScale;
			scale.x = 100;
			scale.y = 1;
			checkpoints[i].transform.localScale = scale;
			var checkpointComponent = checkpoints[i].GetComponent<CheckpointComponent>();
			checkpointComponent.gameManager = this;
			checkpointComponent.id = i * CheckpointFrequency;
		}
	}
	
	private List<GameObject> CreateAlong(List<Vector3> points, GameObject prefab, int frequency, float atElevation) {
		var collection = new List<GameObject>();
		
		for (var i = 0; i < points.Count - frequency; i++) {
			if (i % frequency == 0) {
				var point = points[i] + Vector3.up * atElevation;
				var lookAtIdx = i + frequency;
				var direction = lookAtIdx > points.Count ? point - points[i-1] : points[lookAtIdx] - point;
				var gameObj = Instantiate(prefab, point, Quaternion.LookRotation(direction)) as GameObject;
				collection.Add(gameObj);
			}
		}
		
		return collection;
	}
}
