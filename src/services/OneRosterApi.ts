import { Class } from "../models/class";
import { ServiceApi } from "./ServiceApi";

export class OneRosterApi implements ServiceApi {
    public static i: OneRosterApi;

    private constructor() {
    }

    public static getInstance(): OneRosterApi {
        if (!OneRosterApi.i) {
            OneRosterApi.i = new OneRosterApi();
        }
        return OneRosterApi.i;
    }

    async getClassesForUser(userId: string): Promise<Class[]> {
        const result = {
            "classes": [
                {
                    "sourcedId": "sourcedId2",
                    "status": "active",
                    "dateLastModified": "2022-04-23T18:25:43.511Z",
                    "metadata": {
                        "..permitted extension point..": "..user defined value.."
                    },
                    "title": "English",
                    "classCode": "en",
                    "classType": "homeroom",
                    "location": "Room 19",
                    "grades": ["4 grade",],
                    "subjects": ["English", "Hindi"],
                    "course": {
                        "href": "<href of the course that this is a class of>",
                        "sourcedId": "<sourcedId of the course that this is a class of>",
                        "type": "course"
                    },
                    "school": {
                        "href": "<href of the school that this is a class of>",
                        "sourcedId": "<sourcedId of the school that this is a class of>",
                        "type": "org"
                    },
                    "terms": [
                        {
                            "href": "..URI..",
                            "sourcedId": "..String..",
                            "type": "academicSession"
                        },
                    ],
                    "subjectCodes": ["en", "hi"],
                    "periods": ["period 1", "period 2"],
                    "resources": [
                        {
                            "href": "<href of the first term that this class is in>",
                            "sourcedId": "<sourcedId of the 1st term that this class is in>",
                            "type": "academicSession"
                        },
                    ]
                },
                {
                    "sourcedId": "sourcedId2",
                    "status": "active",
                    "dateLastModified": "2022-04-23T18:25:43.511Z",
                    "metadata": {
                        "..permitted extension point..": "..user defined value.."
                    },
                    "title": "Hindi",
                    "classCode": "hi",
                    "classType": "homeroom",
                    "location": "Room 20",
                    "grades": ["4 grade",],
                    "subjects": ["English", "Hindi"],
                    "course": {
                        "href": "<href of the course that this is a class of>",
                        "sourcedId": "<sourcedId of the course that this is a class of>",
                        "type": "course"
                    },
                    "school": {
                        "href": "<href of the school that this is a class of>",
                        "sourcedId": "<sourcedId of the school that this is a class of>",
                        "type": "org"
                    },
                    "terms": [
                        {
                            "href": "..URI..",
                            "sourcedId": "..String..",
                            "type": "academicSession"
                        },
                    ],
                    "subjectCodes": ["en", "hi"],
                    "periods": ["period 1", "period 2"],
                    "resources": [
                        {
                            "href": "<href of the first term that this class is in>",
                            "sourcedId": "<sourcedId of the 1st term that this class is in>",
                            "type": "academicSession"
                        },
                    ]
                },
            ]
        }
        await new Promise(r => setTimeout(r, 1000));
        const classes: Class[] = []
        for (let i of result.classes) {
            classes.push(Class.fromJson(i))
        }
        return classes;
    }
}