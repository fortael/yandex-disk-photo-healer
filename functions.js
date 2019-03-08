import fs from "fs";
import path from "path";
import piexif from "piexifjs";

/**
 * Attempt to create a directory recursively
 * @param filePath
 * @returns {boolean}
 */
export function ensureDirectoryExistence(filePath) {
    const dirname = filePath;

    if (fs.existsSync(dirname)) {
        return true;
    }

    fs.mkdirSync(dirname, {recursive: true});
}

/**
 * Check if EXIF date tag is provided
 * @param inputPath
 * @returns {boolean}
 */
export function isExifDateEmpty(inputPath) {
    const filePath = path.resolve(inputPath);
    const jpeg = fs.readFileSync(filePath);
    const jpegBinary = jpeg.toString("binary");

    try {
        const piexifObj = piexif.load(jpegBinary);

        return (
            (piexifObj.Exif[piexif.ExifIFD.DateTimeOriginal] || null) === null
            || (piexifObj.Exif[piexif.ExifIFD.DateTimeDigitized] || null) === null
        );
    } catch (e) {
        console.log(`something goes wrong with ${inputPath}`);
        return false;
    }
}

/**
 * Helps to make copy of file in another sub folder
 * @param inputPath
 * @param mod
 */
function saveSubFolder(inputPath, mod) {
    const outputPath = path.join(path.dirname(inputPath), mod, path.basename(inputPath));

    ensureDirectoryExistence(path.dirname(outputPath));

    fs.copyFile(inputPath, outputPath, (err) => {
        if (err) throw err;
    });
}

/**
 * File was okay
 * @param inputPath
 */
export function saveUntouched(inputPath) {
    return saveSubFolder(inputPath, '_untouched');
}

/**
 * Something goes wrong with that file
 * @param inputPath
 */
export function saveCorrupted(inputPath) {
    return saveSubFolder(inputPath, '_corrupted');
}

/**
 * Was unable to fix, for example there is no date in name
 * @param inputPath
 */
export function saveNotFixed(inputPath) {
    return saveSubFolder(inputPath, '_not_fixed');
}

/**
 * What is remain. Usually .mp4 files
 * @param inputPath
 */
export function saveRemain(inputPath) {
    return saveSubFolder(inputPath, '_remain');
}

/**
 * Tag an image with custom date
 * @param inputPath
 * @param data
 */
export function setExifData(inputPath, data = {}) {
    const outputPath = path.join(path.dirname(inputPath), '_fixed', path.basename(inputPath));

    ensureDirectoryExistence(path.dirname(outputPath));

    const filePath = path.resolve(inputPath);
    const jpeg = fs.readFileSync(filePath);
    const jpegBinary = jpeg.toString("binary");
    const piexifObj = piexif.load(jpegBinary);

    piexifObj.Exif = data;

    const bytes = piexif.dump(piexifObj);
    const newData = piexif.insert(bytes, jpegBinary);
    const newJpeg = Buffer.from(newData, "binary");

    fs.writeFileSync(path.resolve(outputPath), newJpeg);
}

/**
 * Take date from file name
 * @param filename
 * @returns {*}
 */
export function matchDateFromName(filename) {
    if (/^IMG-\d*-.*\d*.(jpg|jpeg)$/i.test(filename)) {

        const payload = /IMG-(\d{4})(\d{2})(\d{2})-.*\d*.(jpg|jpeg)/i.exec(filename);
        const year = payload[1];
        const month = payload[2];
        const day = payload[3];

        return `${year}:${month}:${day} 12:00:00`;
    }

    if (/^(\d{4})(\d{2})(\d{2})_.*.(jpg|jpeg)$/i.test(filename)) {

        const payload = /(\d{4})(\d{2})(\d{2})_.*.(jpg|jpeg)/i.exec(filename);
        const year = payload[1];
        const month = payload[2];
        const day = payload[3];

        return `${year}:${month}:${day} 12:00:00`;
    }

    //2014-07-23-0290.jpg
    if (/^(\d{4})-(\d{2})-(\d{2}).*.(jpg|jpeg)$/i.test(filename)) {

        const payload = /(\d{4})-(\d{2})-(\d{2}).*.(jpg|jpeg)/i.exec(filename);
        const year = payload[1];
        const month = payload[2];
        const day = payload[3];

        return `${year}:${month}:${day} 12:00:00`;
    }

    if (/^WP_(\d{4})(\d{2})(\d{2}).*.(jpg|jpeg)$/i.test(filename)) {

        const payload = /WP_(\d{4})(\d{2})(\d{2}).*.(jpg|jpeg)/i.exec(filename);
        const year = payload[1];
        const month = payload[2];
        const day = payload[3];

        return `${year}:${month}:${day} 12:00:00`;
    }

    if (/^(\d{4})-(\d{2})-(\d{2})\s(\d{2})-(\d{2})-(\d{2}).(jpg|jpeg)$/i.test(filename)) {

        const payload = /(\d{4})-(\d{2})-(\d{2})\s(\d{2})-(\d{2})-(\d{2}).(jpg|jpeg)/i.exec(filename);
        const year = payload[1];
        const month = payload[2];
        const day = payload[3];

        const hour = payload[4];
        const minute = payload[5];
        const second = payload[6];

        return `${year}:${month}:${day} ${hour}:${minute}:${second}`;
    }

    console.log(`Unknown file format ${filename}`);

    return null;
}
