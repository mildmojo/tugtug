using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

public class BoatMovementComponent : MonoBehaviour {
	
	public int PlayerIndex;
	public float speed = 90f;
	public float turnSpeed = 5f;
	public float turnAccelRate = 0.1f;
	public float hoverForce = 65f;
	public float hoverHeight = 3.5f;
	public float lateralDragFactor = 0.2f;
	public LayerMask hoverMask;
	public GameObject[] Wheels;
	public GameObject[] Rudders;
	public GameObject Hull;
	public GameObject Flag;
	public string HorizontalAxis = "Horizontal";
	public string VerticalAxis = "Vertical";
	public string Joystick = "joystick 1";
	private float powerInput;
	private float turnInput;
	private Rigidbody carRigidbody;

	private static string[] TURN_INPUTS = new string[] {"up", "down", "left", "right"};
	private KeyCombo[] LeftTurns;
	private KeyCombo[] RightTurns;

	private string[] AccelButtons;
	private string[] DecelButtons;

	private bool IsDone = false;

	void Awake () 
	{
		carRigidbody = GetComponent <Rigidbody>();

		LeftTurns = new KeyCombo[] {
			new KeyCombo(HorizontalAxis, VerticalAxis, new string[] {"up", "left", "down"}, TURN_INPUTS), 
			new KeyCombo(HorizontalAxis, VerticalAxis, new string[] {"down", "right", "up"}, TURN_INPUTS)
		};
		RightTurns = new KeyCombo[] {
			new KeyCombo(HorizontalAxis, VerticalAxis, new string[] {"up", "right", "down"}, TURN_INPUTS), 
			new KeyCombo(HorizontalAxis, VerticalAxis, new string[] {"down", "left", "up"}, TURN_INPUTS)
		};

		AccelButtons = new string[] {Joystick + " button 2", Joystick + " button 3", Joystick + " button 4"};
		DecelButtons = new string[] {Joystick + " button 0", Joystick + " button 1", Joystick + " button 5"};

		foreach (KeyCombo turn in RightTurns.Concat(LeftTurns)) {
			turn.HorizontalAxis = this.HorizontalAxis;
			turn.VerticalAxis = this.VerticalAxis;
		}
	}
	
	void Update () 
	{
		if (IsDone)
		{
			powerInput = 0;
		}
		else
		{
			if (AccelButtons.Any(btn => Input.GetKeyDown(btn)))
			{
				powerInput += 0.1f;
			}
			if (DecelButtons.Any(btn => Input.GetKeyDown(btn)))
			{
				powerInput -= 0.1f;
			}
			powerInput = Mathf.Clamp(powerInput, -1, 1);
//			Debug.Log (powerInput);
			//powerInput = Input.GetAxis (VerticalAxis);
		}

		if (RightTurns.Any(turn => turn.Check()))
		{
			turnInput += turnAccelRate;
		}
		if (LeftTurns.Any(turn => turn.Check()))
		{
			turnInput -= turnAccelRate;
		}
		var turnLimit = 1.5f - 1.5f % turnAccelRate;
		turnInput = Mathf.Clamp(turnInput, -turnLimit, turnLimit);
		//turnInput = Input.GetAxis (HorizontalAxis);
		//Debug.Log(turnInput);
	}
	
	void FixedUpdate()
	{
		Mesh hullMesh = Hull.GetComponent<MeshFilter>().mesh;
		float hullWidth = hullMesh.bounds.size.z;
		float hullLength = hullMesh.bounds.size.x;
		Vector3 center = carRigidbody.worldCenterOfMass;//Hull.renderer.bounds.center;
		Vector3 keel = carRigidbody.worldCenterOfMass;// - transform.up * hullWidth / 4;
		Quaternion rotateLeft = Quaternion.AngleAxis(-90, transform.up);
		Quaternion rotateRight = Quaternion.AngleAxis(90, transform.up);

		Vector3[] outriggers = new Vector3[] {
			center + transform.forward * hullLength * 0.5f,
			center - transform.forward * hullLength * 0.5f,
			center + rotateLeft * transform.forward * hullWidth * 0.5f,
			center + rotateRight * transform.forward * hullWidth * 	0.5f
		};

		foreach (Vector3 outrigger in outriggers) {
			// Test from up high to prevent boat from capsizing.
			Vector3 tallrigger = outrigger + transform.up * 2;
			Ray ray = new Ray(tallrigger, -transform.up);
			RaycastHit hit;

			Debug.DrawRay(tallrigger, -transform.up * hoverHeight,Color.red);

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
				Vector3 appliedHoverForce = transform.up * hoverForce * proportionalHeight;
				
				//Debug.Log(appliedHoverForce);
				if (!IsDone)
				{
					carRigidbody.AddForceAtPosition(appliedHoverForce, outrigger, ForceMode.Force);
				}
			}
			else
			{
				//Debug.Log("done");
				//Vector3 appliedHoverForce = -Vector3.up * hoverForce / 10f;
				//carRigidbody.AddForce(appliedHoverForce, ForceMode.Force);
			}
		}

		carRigidbody.AddRelativeForce(0f, 0f, powerInput * speed);
//		carRigidbody.AddRelativeTorque(0f, turnInput * turnSpeed, 0f);
		carRigidbody.angularVelocity = new Vector3(carRigidbody.angularVelocity.x, 
		                                           Mathf.Lerp(carRigidbody.angularVelocity.y, turnInput, 0.01f),
		                                           carRigidbody.angularVelocity.z);

		// Keel drag
		Debug.DrawRay(keel, -Vector3.Project(carRigidbody.velocity, transform.right) * lateralDragFactor, Color.cyan);
		carRigidbody.AddForceAtPosition(-Vector3.Project(carRigidbody.velocity, transform.right) * lateralDragFactor,
		                                keel, ForceMode.Force);

		for (int i = 0; i < Wheels.Length; i++)
		{
			Wheels[i].transform.Rotate(0, 0, -powerInput * 2);
		}

		Quaternion rot = Quaternion.identity;

		for (int i = 0; i < Rudders.Length; i++)
		{
			rot.eulerAngles = new Vector3(0, 45 * -turnInput, 0);
			Rudders[i].transform.localRotation = rot;
		}

		if (Flag != null)
		{
			rot = Quaternion.identity;
			rot.eulerAngles = new Vector3(0, 45 * turnInput, 0);
			Flag.transform.localRotation = rot;
		}
	}

	public void ResetInputs() {
		powerInput = 0;
		turnInput = 0;
	}

	private void OnTriggerEnter(Collider other)
	{
		if (other.CompareTag("Finish"))
		{
			GameManager.PlayerTimes[PlayerIndex] = RaceManager.RaceTime;
			Debug.Log(PlayerIndex.ToString() + " " + GameManager.PlayerTimes[PlayerIndex].ToString());
			IsDone = true;
		}
	}
}
