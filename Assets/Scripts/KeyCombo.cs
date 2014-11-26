using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;

public class KeyCombo
{
	public string VerticalAxis;
	public string HorizontalAxis;
	public string axisName;
	public string[] buttons;
	public string[] buttonWhitelist;
	private int currentIndex = 0; //moves along the array as buttons are pressed
	
	public float allowedTimeBetweenButtons = 0.3f; //tweak as needed
	private float timeLastButtonPressed;

	public KeyCombo(string axisX, string axisY, string[] btns) : this(axisX, axisY, btns, new string[0]) {
	}

	public KeyCombo(string axisX, string axisY, string[] btns, string[] whitelist)
	{
		buttons = btns;
		buttonWhitelist = whitelist;
		HorizontalAxis = axisX;
		VerticalAxis = axisY;
	}
	
	//usage: call this once a frame. when the combo has been completed, it will return true
	public bool Check()
	{
		if (Time.time > timeLastButtonPressed + allowedTimeBetweenButtons) currentIndex = 0;

		List<string> buttonsDown = GetButtonsDown();
		string nextButton = buttons[currentIndex];
		string lastButton = currentIndex > 0 ? buttons[currentIndex - 1] : nextButton;

		if (buttonsDown.Contains(nextButton)) {
			timeLastButtonPressed = Time.time;
			currentIndex++;
		} else if (buttonsDown.Contains(lastButton)) {
			// Ignore a combo button as long as it's held down.
			timeLastButtonPressed = Time.time;
		} else if (buttonsDown.Count() > 0) {
			currentIndex = 0;
		}

		if (currentIndex >= buttons.Length)
		{
			currentIndex = 0;
			return true;
		}

		return false;
	}

	private List<string> GetButtonsDown() {
		List<string> buttonsDown = new List<string>();

		if (Input.GetAxisRaw(VerticalAxis) < -0.8) buttonsDown.Add("down");
		if (Input.GetAxisRaw(VerticalAxis) >  0.8) buttonsDown.Add("up");
		if (Input.GetAxisRaw(HorizontalAxis) > -0.8) buttonsDown.Add("left");
		if (Input.GetAxisRaw(HorizontalAxis) <  0.8) buttonsDown.Add("right");

		foreach (string button in buttons) {
			if (Input.GetKey(button)) buttonsDown.Add(button);
		}

		if (buttonWhitelist.Count() > 0) {
			buttonsDown = buttonsDown.Intersect(buttonWhitelist).ToList();
		}

		return buttonsDown;
	}
}