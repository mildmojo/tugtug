using UnityEngine;
using System.Collections;

public class Interpolate
{
	public static float EaseIn(float start, float end, float time)
	{
		time = Mathf.Clamp(time, 0, 1);
		float delta = end - start;
		return delta * time * time + start;
	}
	
	public static float EaseOut(float start, float end, float time)
	{
		time = Mathf.Clamp(time, 0, 1);
		float delta = end - start;
		return -delta * time * (time - 2) + start;
	}
	
	public static float EaseInOut(float start, float end, float time)
	{
		time = Mathf.Clamp(time * 2, 0, 2);
		float delta = end - start;
		if (time < 1)
			return delta / 2 * time * time + start;
		time--;
		return -delta / 2 * (time * (time - 2) - 1) + start;
	}
	
	public static float EaseInCubic(float start, float end, float time)
	{
		time = Mathf.Clamp(time, 0, 1);
		float delta = end - start;
		return delta * time * time * time + start;
	}
	
	public static float EaseOutCubic(float start, float end, float time)
	{
		time = Mathf.Clamp(time, 0, 1);
		float delta = end - start;
		time--;
		return delta * (time * time * time + 1) + start;
	}
	
	public static float EaseInOutCubic(float start, float end, float time)
	{
		time = Mathf.Clamp(time * 2, 0, 2);
		float delta = end - start;
		if (time < 1)
			return delta / 2 * time * time * time + start;
		time -= 2;
		return delta / 2 * (time * time * time + 2) + start;
	}
}
