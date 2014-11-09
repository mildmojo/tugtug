using UnityEngine;
using System.Collections;

public class BoatMovementComponent : MonoBehaviour {
	
	public float speed = 90f;
	public float turnSpeed = 5f;
	public float hoverForce = 65f;
	public float hoverHeight = 3.5f;
	public LayerMask hoverMask;
	public GameObject[] Wheels;
	public GameObject[] Rutters;
	public GameObject Flag;
	public string HorizontalAxis = "Horizontal";
	public string VerticalAxis = "Vertical";
	private float powerInput;
	private float turnInput;
	private Rigidbody carRigidbody;
	
	void Awake () 
	{
		carRigidbody = GetComponent <Rigidbody>();
	}
	
	void Update () 
	{
		powerInput = Input.GetAxis (VerticalAxis);
		turnInput = Input.GetAxis (HorizontalAxis);
	}
	
	void FixedUpdate()
	{
		Ray ray = new Ray (transform.position, -Vector3.up);
		RaycastHit hit;

		Debug.DrawRay(transform.position, -Vector3.up * hoverHeight, Color.red);

		if (Physics.Raycast(ray, out hit, hoverHeight, hoverMask))
		{
			//Debug.Log(hit.collider.gameObject);

			float proportionalHeight;
			float heightpercent = (hoverHeight - hit.distance) / hoverHeight;
			//Debug.Log(rigidbody.velocity.y);
			if (rigidbody.velocity.y <= 0)
			{
				proportionalHeight = Mathf.Clamp(-rigidbody.velocity.y / 5f, 0f, 1f) + heightpercent;
				//Debug.Log(proportionalHeight + " " + rigidbody.velocity.y + " " + heightpercent);
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
			//Debug.Log("done");
			//Vector3 appliedHoverForce = -Vector3.up * hoverForce / 10f;
			//carRigidbody.AddForce(appliedHoverForce, ForceMode.Force);
		}
		
		carRigidbody.AddRelativeForce(0f, 0f, powerInput * speed);
		carRigidbody.AddRelativeTorque(0f, turnInput * turnSpeed, 0f);

		for (int i = 0; i < Wheels.Length; i++)
		{
			Wheels[i].transform.Rotate(0, 0, -powerInput);
		}

		Quaternion rot = Quaternion.identity;

		for (int i = 0; i < Rutters.Length; i++)
		{
			rot.eulerAngles = new Vector3(0, 45 * -turnInput, 0);
			Rutters[i].transform.localRotation = rot;
		}

		if (Flag != null)
		{
			rot = Quaternion.identity;
			rot.eulerAngles = new Vector3(0, 45 * turnInput, 0);
			Flag.transform.localRotation = rot;
		}
	}
}