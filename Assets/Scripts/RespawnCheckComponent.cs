using UnityEngine;
using System.Collections.Generic;
using System.Linq;

public class RespawnCheckComponent : MonoBehaviour {

	[HideInInspector] [System.NonSerialized]
	public float RespawnDropHeight = 10f;

	[HideInInspector] [System.NonSerialized]
	public float RespawnVelocityPercentage = 0.75f;

	private bool isExiting = false;

	// Use this for initialization
	void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {

	}

	void OnApplicationQuit() {
		isExiting = true;
	}

	void OnBecameInvisible() {
		if (isExiting) return;

		var standings = GameManager.GetStandings();
		var frontPlayer = standings == null ? GameManager.Players[0] : standings.First();
		
		transform.root.position = frontPlayer.transform.position + Vector3.up * GameManager.RespawnDropHeight;
		transform.root.rotation = Quaternion.LookRotation(frontPlayer.transform.forward);
		transform.root.rigidbody.velocity = frontPlayer.rigidbody.velocity * GameManager.RespawnVelocityPercentage;
	}
}
