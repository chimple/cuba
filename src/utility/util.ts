import { Http } from "@capacitor-community/http";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import createFilesystem from "capacitor-fs";
import { unzip } from "zip2";
import { BUNDLE_URL } from "../common/constants";
import { Course } from "../interface/curriculumInterfaces";
import { GUIDRef } from "../interface/modelInterfaces";

export class Util {

    public static getGUIDRef(map: any): GUIDRef {
        return { href: map?.href, sourcedId: map?.sourcedId, type: map?.type }
    }

    public static async downloadZipBundle(lessonIds: string[]): Promise<boolean> {
        for (let lessonId of lessonIds) {
            try {
                if (!Capacitor.isNativePlatform()) return true;
                console.log("downloading Directory.Cache", Directory.Cache, "Directory.Library",)
                const fs = createFilesystem(Filesystem, {
                    rootDir: "/",
                    directory: Directory.Cache,
                    base64Alway: false,
                })
                const path = (localStorage.getItem("gameUrl") ?? "http://localhost/_capacitor_file_/data/user/0/org.chimple.cuba/cache/") + lessonId + "/index.js";
                console.log("cheching path..", "path", path)
                const res = await fetch(path)
                const isExists = res.ok;
                console.log("fethting path", path);
                console.log('isexists', isExists);
                if (isExists) continue;
                console.log("fs", fs)
                const url = BUNDLE_URL + lessonId + ".zip"
                const zip = await Http.get({ url: url, responseType: "blob" })
                if (zip instanceof Object) {
                    console.log('unzipping ',)
                    const buffer = Uint8Array.from(atob(zip.data), c => c.charCodeAt(0))
                    await unzip({
                        fs: fs,
                        extractTo: lessonId,
                        filepaths: ["."],
                        filter: (filepath: string) => filepath.startsWith("dist/") === false,
                        onProgress: (event) => console.log("event unzipping ", event.total, event.filename, event.isDirectory, event.loaded),
                        data: buffer,
                    })

                    console.log('un  zip done')
                }

                console.log('zip ', zip)

            } catch (error) {
                console.log("errpor", error)
                return false;
            }
        }
        return true;
    }


    // To parse this data:
    //   const course = Convert.toCourse(json);

    public static toCourse(json: string): Course {
        return JSON.parse(JSON.stringify(json));
    }

    public static courseToJson(value: Course): string {
        return JSON.stringify(value);
    }

}