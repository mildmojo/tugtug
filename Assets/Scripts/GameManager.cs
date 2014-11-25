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

	public List<GameObject> PlayerPrefabs = new List<GameObject>();

	public static List<GameObject> Players = new List<GameObject>();
	public static List<float> PlayerTimes = new List<float>();

	private bool playersSpawned = false;
	private Vector3 spawnPoint = Vector3.zero;
	private List<Vector3> riverPoints = null;

	public void Start()
	{
#if UNITY_EDITOR
		P1 = true;
#endif
	}

	void Update() {
		if (!playersSpawned && spawnPoint != Vector3.zero) {
			SpawnPlayers();
		}

		if (spawnPoint == Vector3.zero) {
			SendMessage("NextRiver");
		}	
	}

	// RiverManager will SendMessage to set start point. Because compilation order.
	public void SetSpawnPoint(Vector3 point) {
		spawnPoint = point;
	}
	
	// RiverManager will SendMessage to set river points. Because compilation order.
	public void SetRiverPoints(List<Vector3> points) {
		riverPoints = points;
	}

	private void SpawnPlayers() {
		// Instantiate.
		for (var i = 0; i < MAX_PLAYERS; i++) {
			var obj = Instantiate(PlayerPrefabs[i]) as GameObject;
			Players.Add(obj);
			PlayerTimes.Add(float.PositiveInfinity);
		}

		// Formation width is N boats plus N-1 boat-sized spaces.
		var formationWidth = 0f;
		foreach (var boat in Players) {
			var bounds = new Bounds();
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

}
