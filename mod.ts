import { parse } from "https://esm.sh/content-disposition@0.5.4"
import { fileTypeFromStream } from "https://esm.sh/file-type@21.0.0"
import {
    BlobReader,
    ZipReader,
} from "https://esm.sh/jsr/@zip-js/zip-js@.7.72"

const dab =
<T>
(f: () => T) => {
    let res: T | undefined = undefined
    try {
        res = f()
    } catch {
        //
    }
    return res
}

const getMime =
async (res: Response) => {
    const { ext: _, mime } = res.body && await fileTypeFromStream(res.body) || {}
    return mime
}

const getZip =
async (res: Response) => {
    const reader = new ZipReader(new BlobReader(await res.blob()))
    const entries = await reader.getEntries()

    return entries.map(x => x.filename)
}

const getHash =
async (res: Response) =>
    crypto.subtle.digest("SHA-256", await res.arrayBuffer())
        .then(buffer => new Uint8Array(buffer)
            .values()
            .toArray()
            .map(x => x.toString(16))
            .join("")
        )

const download =
async (url: string | URL) => {
    const res = await fetch(url)

    const filename = dab(() => {
        const parsed = parse(res.headers.get("content-disposition")!)
        return decodeURI(parsed.parameters.filename)
    })

    const mime = await getMime(res.clone())

    const entries = await getZip(res.clone())
    
    const hash = await getHash(res)
    
    console.log({
        filename,
        mime,
        entries,
        hash,
    })
}

download("http://localhost:8000/01+정류소간+버스+이용객수_2024.zip")
// download("https://gits.gg.go.kr/gtdb/common/download2.do?f=Wh4wI2ui81tDeDmk05mMDQm%2FBN7%2FHSqeAZ14%2BjDQsYa%2BuY09%2F%2FNi6OqlmXHq5BlKHyug1Wk%2F%2Fx8%2B%0D%0AMlvcx3rP6Q%3D%3D%0D%0A")
