import { Http } from '@capacitor-community/http';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { unzip } from "zip2"
import { createFilesystem } from "capacitor-fs";



export const downloadFile = async (lessonId = "en_PreQuiz"): Promise<boolean> => {
    try {
        console.log("downloading Directory.Data", Directory.Data, "Directory.Library",)
        const fs = createFilesystem(Filesystem, {
            rootDir: "/",
            directory: Directory.Data,
            base64Alway: false,
        })
        const path = (localStorage.getItem("gameUrl") ?? "http://localhost/_capacitor_file_/data/user/0/org.chimple.cuba/files/") + lessonId + "/index.js";
        console.log("cheching path..", "path", path)
        const res = await fetch(path)
        const isExists = res.ok;
        console.log("fethting path", path);
        console.log('isexists', isExists);
        if (isExists) return true;
        console.log("fs", fs)
        const url = "https://github.com/chimple/chimple-zips/raw/main/" + lessonId + ".zip"
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
        return true;

    } catch (error) {
        console.log("errpor", error)
        return false;
    }
};