using UnityEngine;
public class KeyCombo
{
	public string VerticalAxis = "Vertical";
	public string HorizontalAxis = "Horizontal";
	public string[] buttons;
	private int currentIndex = 0; //moves along the array as buttons are pressed
	
	public float allowedTimeBetweenButtons = 0.3f; //tweak as needed
	private float timeLastButtonPressed;
	
	public KeyCombo(string[] b)
	{
		buttons = b;
	}
	
	//usage: call this once a frame. when the combo has been completed, it will return true
	public bool Check()
	{
		if (Time.time > timeLastButtonPressed + allowedTimeBetweenButtons) currentIndex = 0;
		if (currentIndex < buttons.Length)
		{
			if ((buttons[currentIndex] == "down" && Input.GetAxisRaw(VerticalAxis) <= -0.8) ||
			    (buttons[currentIndex] == "up" && Input.GetAxisRaw(VerticalAxis) >= 0.8) ||
			    (buttons[currentIndex] == "left" && Input.GetAxisRaw(HorizontalAxis) <= -0.8) ||
			    (buttons[currentIndex] == "right" && Input.GetAxisRaw(HorizontalAxis) >= 0.8) ||
			    (buttons[currentIndex] != "down" && buttons[currentIndex] != "up" && buttons[currentIndex] != "left" && buttons[currentIndex] != "right" && Input.GetButtonDown(buttons[currentIndex])))
			{
				timeLastButtonPressed = Time.time;
				currentIndex++;
			}
			
			if (currentIndex >= buttons.Length)
			{
				currentIndex = 0;
				return true;
			}
			else return false;
		}

		return false;
	}
}