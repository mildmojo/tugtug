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

	private KeyCombo RightTurn = new KeyCombo(new string[] {"down", "left", "up", "right"});
	private KeyCombo LeftTurn = new KeyCombo(new string[] {"down", "right", "up", "left"});

	void Awake () 
	{
		carRigidbody = GetComponent <Rigidbody>();
		RightTurn.HorizontalAxis = this.HorizontalAxis;
		RightTurn.VerticalAxis = this.VerticalAxis;

		LeftTurn.HorizontalAxis = this.HorizontalAxis;
		LeftTurn.VerticalAxis = this.VerticalAxis;
	}
	
	void Update () 
	{
		if (Input.GetKeyDown("joystick 1 button 0"))
		{
			powerInput += 0.1f;
		}
		if (Input.GetKeyDown("joystick 1 button 1"))
		{
			powerInput -= 0.1f;
		}
		powerInput = Mathf.Clamp(powerInput, -1, 1);
		//Debug.Log (powerInput);
		//powerInput = Input.GetAxis (VerticalAxis);

		if (RightTurn.Check())
		{
			//Debug.Log("Right");
			turnInput += 0.1f;
		}
		if (LeftTurn.Check())
		{
			//Debug.Log("Left");

			turnInput -= 0.1f;
		}
		//turnInput = Input.GetAxis (HorizontalAxis);
		//Debug.Log(turnInput);
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