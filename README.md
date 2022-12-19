# Cuba

## Demo:

For web Demo [Click Here](https://chimple.github.io/cuba/)

To Download the Debug APK [Click Here](https://github.com/chimple/cuba/raw/apk/app-debug.apk)

## Prerequisites

This project requires NodeJS (version 8 or later) and NPM.
[Node](http://nodejs.org/) and [NPM](https://npmjs.org/) are really easy to install.
To make sure you have them available on your machine,
try running the following command.

```sh
$ npm -v && node -v
8.5.0
v16.14.2
```

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

Start with cloning this repo on your local machine:

```sh
$ git clone https://github.com/chimple/cuba
$ cd cuba
```

To install and set up the library, run:

```sh
$ npm install
```

## Usage

### Serving the app

```sh
$ npm run start
```

Open in localhost

> Open http://localhost:3000/ in your browser

### Building the project

```sh
$ npm run build
```

### Serve Build folder

```sh
$ npm run serve-build
```

Open in localhost

> Open http://localhost:8080/ in your browser

### Create android debug apk

```sh
$ cd android
$ ./gradlew assembleDebug
```

Now we can find the apk on `android/app/build/outputs/apk/debug/app-debug.apk`

### Make sure ./gradlew is executable

```sh
$ chmod +x ./gradlew
```
