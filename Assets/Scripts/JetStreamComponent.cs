using UnityEngine;
using System.Collections;

public class JetStreamComponent : MonoBehaviour {

	public Vector3 Force;
	
	private void OnTriggerEnter(Collider collider)
	{
		AddForce(collider);
	}

	private void OnTriggerStay(Collider collider)
	{
		AddForce(collider);
	}

	private void AddForce(Collider collider)
	{
		collider.attachedRigidbody.AddForce(Force);
	}
}
