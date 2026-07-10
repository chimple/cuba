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

# Analytics Dashboard

## Chimple Generic Dashboard:

For Chimple Generic Dashboard link [Click Here](https://lookerstudio.google.com/reporting/9b016b62-2bd2-4d4c-bf4d-1168cd640842/page/W5YXC)


## Step to See New School data on Generic Dashboard:

1.This Dasboard requires permission to access the current viewer's email address in order to personalize the data shown to that viewer. When you consent to sharing your address with that report, the underlying data source can use that to return only the data associated with that address.

<img width="953" alt="Screenshot 2023-08-17 110918" src="https://github.com/chimple/cuba/assets/62737989/6192f948-af13-439c-aeb2-a5cfe723037d">

2. After creating schools and classes in malta. we have to push school information in scool table only once
3. we need to add user Email id and school ID into Teacher Table ( this step is not required  after we release Malta APP). with this step user is part of this particular school

   Use below Query to add Email id along with user Info
   
```sh
INSERT INTO `bahama-stage.proc.teacher` values ('20230802','2023-08-02 05:14:57.932000 UTC','UUID','User Name','School Name','SchoolId','CSeI4m0bA3psWz3Kf62','emailId@gmail.org')
```

