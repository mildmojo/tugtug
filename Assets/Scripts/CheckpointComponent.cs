using UnityEngine;
using System.Collections;

public class CheckpointComponent : MonoBehaviour {

	[HideInInspector] [System.NonSerialized]
	public GameManager gameManager;

	[System.NonSerialized]
	// Numeric ID representing distance from start.
	public int id;

	void Start () {
	
	}
	
	void Update () {
	
	}

	void OnTriggerEnter(Collider collider) {
		GameManager.EnterCheckpoint(id, collider.transform.root.gameObject);
	}

	void OnTriggerExit(Collider collider) {
		GameManager.ExitCheckpoint(id, collider.transform.root.gameObject);
	}
}
