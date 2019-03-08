import piexif from 'piexifjs';
import path from 'path';
import fs from 'fs';

import {
    setExifData, matchDateFromName, isExifDateEmpty, saveUntouched, saveRemain, saveNotFixed,
} from './functions';

const folder = process.env.npm_config_folder || null;

if (folder === null) {
    console.log('--folder is not provided');
    process.exit();
}

const ignore = ['_fixed', '.DS_Store'];

fs.readdir(folder, (err, files) => {
    files.forEach((file) => {
        if (ignore.includes(file)) {
            return;
        }

        const filePath = path.join(folder, file);

        if (!file.includes('jpg')
            && !file.includes('jpeg')
            && !file.includes('JPEG')
            && !file.includes('JPG')
        ) {
            saveRemain(filePath);
            return;
        }

        if (!isExifDateEmpty(filePath)) {
            saveUntouched(filePath);
            return;
        }

        const date = matchDateFromName(file);

        if (date) {
            setExifData(filePath, {
                [piexif.ExifIFD.DateTimeOriginal]: date,
                [piexif.ExifIFD.DateTimeDigitized]: date,
            });
            return;
        }

        saveNotFixed(filePath);
    });
});
