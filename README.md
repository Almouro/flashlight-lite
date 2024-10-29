# flashlight-lite

Quick demo of how [Flashlight](https://github.com/bamlab/flashlight) works under the hood, and how
it can be recoded in a few lines of code!

## Get your app pid

First, get your app id. You should be able to find it in the output of that command:

```bash
adb shell dumpsys window | grep mFocused
```

For instance, it's `com.twitter.android` for the Twitter app.
Then get the app pid:

```bash
adb shell pidof <your_app_id>
```

## CPU measures

```bash
kotlinc -script solution/cpu.kts <your_app_pid>
```

## FPS measures

```bash
kotlinc -script solution/fps.kts <your_app_pid>
```

## Try the real thing

Checkout the [Flashlight docs](https://docs.flashlight.dev)
