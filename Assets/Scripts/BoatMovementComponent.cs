using UnityEngine;
using System.Collections;

public class BoatMovementComponent : MonoBehaviour {
	
	public float speed = 90f;
	public float turnSpeed = 5f;
	public float hoverForce = 65f;
	public float hoverHeight = 3.5f;
	public LayerMask hoverMask;
	private float powerInput;
	private float turnInput;
	private Rigidbody carRigidbody;
	
	
	void Awake () 
	{
		carRigidbody = GetComponent <Rigidbody>();
	}
	
	void Update () 
	{
		powerInput = Input.GetAxis ("Vertical");
		turnInput = Input.GetAxis ("Horizontal");
	}
	
	void FixedUpdate()
	{
		Ray ray = new Ray (transform.position, -transform.up);
		RaycastHit hit;
		
		if (Physics.Raycast(ray, out hit, hoverHeight, hoverMask))
		{
			Debug.Log(hit.collider.gameObject);
			Debug.DrawRay(transform.position, -Vector3.up * hoverHeight, Color.red);
			
			float proportionalHeight;
			float heightpercent = (hoverHeight - hit.distance) / hoverHeight;
			//Debug.Log(rigidbody.velocity.y);
			if (rigidbody.velocity.y <= 0)
			{
				proportionalHeight = Mathf.Clamp(-rigidbody.velocity.y / 5f, 0f, 1f) + heightpercent;
				Debug.Log(proportionalHeight + " " + rigidbody.velocity.y + " " + heightpercent);
			}
			else
			{
				proportionalHeight = heightpercent;
			}
			Vector3 appliedHoverForce = Vector3.up * hoverForce * proportionalHeight;
			
			//Debug.Log(appliedHoverForce);
			carRigidbody.AddForce(appliedHoverForce, ForceMode.Force);
		}
		else
		{
			Debug.Log("done");
			//Vector3 appliedHoverForce = -Vector3.up * hoverForce / 10f;
			//carRigidbody.AddForce(appliedHoverForce, ForceMode.Force);
		}
		
		carRigidbody.AddRelativeForce(0f, 0f, powerInput * speed);
		carRigidbody.AddRelativeTorque(0f, turnInput * turnSpeed, 0f);
		
	}
}