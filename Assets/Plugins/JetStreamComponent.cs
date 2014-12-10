using UnityEngine;

public class JetStreamComponent : MonoBehaviour {

	public float MaxStreamSpeed;
	public Vector3 Force;

	[HideInInspector] [System.NonSerialized]
	public Vector3 forward;

	void Update() {
		Debug.DrawRay(transform.position, transform.forward * 5, Color.green);
	}

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
		var body = collider.attachedRigidbody;
		if (Vector3.Project(body.velocity, transform.forward).magnitude < MaxStreamSpeed) {
			body.AddForce(Quaternion.LookRotation(transform.forward) * Force);
		}
	}
}
