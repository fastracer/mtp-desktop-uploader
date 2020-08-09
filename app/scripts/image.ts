import fs from 'fs';
import Async from 'async';
import path from 'path';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import jimp from 'jimp';
import { IGeoPoint } from '../types/IGeoPoint';
import {
  Result,
  Photo,
  Connections,
  Descriptions,
  Description,
} from '../types/Result';

import {
  getBearing,
  getDistance,
  getPitch,
  getSequenceImagePath,
  OutputType,
  getSequenceOutputPath,
} from './utils';

const { Tags, exiftool } = require('exiftool-vendored');

export const filterCorruptImages = (
  files: string[],
  dirPath: string,
  ouptputpath: string,
  next: CallableFunction
) => {
  const newfiles: string[] = [];
  Async.each(
    files,
    (filename: string, cb: CallableFunction) => {
      jimp
        .read(path.join(dirPath, filename))
        .then((image: any) => {
          // eslint-disable-next-line no-underscore-dangle
          if (image._rgba) {
            newfiles.push(filename);
          }
          return image;
        })
        .catch((err) => console.log('JIMP: ', err));
    },
    (error: Error | any) => {
      if (!error) next(null, newfiles, ouptputpath);
      else next(error);
    }
  );
};

export const copyFiles = (
  files: string[],
  dirPath: string,
  outputpath: string,
  next: CallableFunction
) => {
  Async.each(
    files,
    (filename: string, cb: CallableFunction) => {
      fs.copyFile(
        path.join(dirPath, filename),
        path.join(outputpath, filename),
        (err) => {
          if (err) cb(err);
          else cb(null);
        }
      );
    },
    (error: Error | any) => {
      if (!error) next(null, files, outputpath);
      else next(error);
    }
  );
};

export function getPoint(dirpath: string, filename: string) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(dirpath, filename);
    exiftool
      .read(filepath)
      .then((tags: typeof Tags) => {
        let azimuth = tags.PoseHeadingDegrees;
        if (!azimuth) azimuth = tags.GPSImgDirection;

        let pitch = tags.PosePitchDegrees;
        if (!pitch) pitch = tags.CameraElevationAngle;

        let datetime = tags.GPSDateTime ? dayjs(tags.GPSDateTime) : undefined;
        if (!datetime)
          datetime = tags.DateTimeOrignal
            ? dayjs(tags.DateTimeOrignal)
            : undefined;

        if (datetime) {
          const item = new IGeoPoint({
            GPSDateTime: datetime,
            GPSLatitude: tags.GPSLatitude,
            GPSLongitude: tags.GPSLongitude,
            GPSAltitude: tags.GPSAltitude,
            Image: filename,
            Azimuth: azimuth,
            Pitch: pitch,
            origin_GPSLatitude: tags.GPSLatitude,
            origin_GPSLongitude: tags.GPSLongitude,
            origin_GPSAltitude: tags.GPSAltitude,
            origin_Azimuth: azimuth,
            origin_Pitch: pitch,
            camera_make: tags.Make,
            camera_model: tags.Model,
            width: tags.ImageWidth,
            height: tags.ImageHeight,
          });
          return resolve(item);
        }
        return resolve({
          Image: filename,
        });
      })
      .catch((err: Error) => {
        return reject(err);
      });
  });
}

export const getPoints = (
  files: string[],
  outputpath: string,
  next: CallableFunction
) => {
  const result: IGeoPoint[] = [];
  const removedfiles: string[] = [];

  Async.each(
    files,
    (filename: string, cb: CallableFunction) => {
      getPoint(outputpath, filename)
        // eslint-disable-next-line promise/always-return
        .then((item: any) => {
          if (item.GPSDateTime) {
            result.push(item);
          } else {
            removedfiles.push(item.Image);
          }
          return cb(null);
        })
        .catch((err: Error) => {
          console.error('Something terrible happened: ', err);
          cb(err);
        });
    },
    (error: Error | any) => {
      if (!error) {
        next(null, result, removedfiles);
      } else {
        next(error);
      }
    }
  );
};

export const calculatePoints = (
  points: IGeoPoint[],
  removedfiles: string[],
  next: CallableFunction
) => {
  try {
    points.sort((firstItem: IGeoPoint, secondItem: IGeoPoint) => {
      return secondItem.getDate().isBefore(firstItem.getDate()) ? 1 : -1;
    });

    const existedFarPoint =
      points.filter((item: IGeoPoint, idx) => {
        return (
          idx < points.length - 1 &&
          item.getDate().diff(points[idx + 1].getDate(), 'second') > 120
        );
      }).length > 0;
    if (existedFarPoint) {
      throw 'some photos are too far apart by time';
    }

    if (
      points.filter(
        (item: IGeoPoint) => !item.GPSLatitude || !item.GPSLongitude
      ).length === 0
    ) {
      points.forEach((point: IGeoPoint, idx: number) => {
        if (idx < points.length - 1) {
          const nextPoint = points[idx + 1];

          let azimuth = point.Azimuth;
          if (!azimuth) {
            azimuth = getBearing(point, nextPoint);
            point.setAzimuth(azimuth);
          }

          const distance = getDistance(nextPoint, point);
          point.setDistance(distance);

          let pitch = point.Pitch;
          if (!pitch) {
            pitch = getPitch(point, nextPoint, distance);
            point.setPitch(pitch);
          }
        } else {
          point.setDistance(0);

          const prevPoint = points[idx - 1];
          if (!point.Azimuth && prevPoint.Azimuth) {
            point.setAzimuth(prevPoint.Azimuth);
          }
          if (!point.Pitch && prevPoint.Pitch) {
            point.setPitch(prevPoint.Pitch);
          }
        }
      });
    }

    next(null, { points, removedfiles });
  } catch (e) {
    console.log('Calculation points issue', e);
    next({
      message: e,
    });
  }
};

export function loadImages(
  dirPath: string,
  outputpath: string,
  callback: CallableFunction
) {
  const files = fs.readdirSync(dirPath);
  Async.waterfall(
    [
      (cb1: CallableFunction) => {
        if (!fs.existsSync(outputpath)) {
          fs.mkdirSync(outputpath);
        }
        cb1(null, files, dirPath, outputpath);
      },
      // filterCorruptImages,
      copyFiles,
      getPoints,
      calculatePoints,
    ],
    (err: any, result) => {
      callback(err, result);
    }
  );
}

export async function addLogo(imageurl: string, logourl: string) {
  const [image, logo] = await Promise.all([
    jimp.read(imageurl),
    jimp.read(logourl),
  ]);

  const percentage = 0.12;

  logo.rotate(180);

  logo.flip(true, true);

  logo.resize(image.bitmap.width, image.bitmap.height * percentage);

  const X = 0;
  const Y = image.bitmap.height - image.bitmap.height * percentage;

  // const LOGO_MARGIN_PERCENTAGE = 10;

  // logo.resize(image.bitmap.width / 10, jimp.AUTO);

  // const xMargin = (image.bitmap.width * LOGO_MARGIN_PERCENTAGE) / 100;
  // const yMargin = (image.bitmap.width * LOGO_MARGIN_PERCENTAGE) / 100;

  // const X = image.bitmap.width - logo.bitmap.width - xMargin;
  // const Y = image.bitmap.height - logo.bitmap.height - yMargin;

  const blendmode: any = {
    mode: jimp.BLEND_SOURCE_OVER,
    opacitySource: 1,
    opacityDest: 1,
  };

  return image.composite(logo, X, Y, blendmode);
}

export function writeExifTags(
  input_file: string,
  item: IGeoPoint,
  description: Description,
  outputfile: any = false
) {
  return new Promise((resolve, reject) => {
    const datetime = dayjs(item.GPSDateTime);
    if (outputfile) {
      fs.exists(outputfile, (existed) => {
        if (existed) {
          fs.unlink(outputfile, console.log);
        }
      });
    }

    const options: string[] = outputfile
      ? ['-o', outputfile]
      : ['-overwrite_original'];

    const azimuth = (item.Azimuth || 0) > 0 ? item.Azimuth : 360 + item.Azimuth;

    exiftool
      .write(
        input_file,
        {
          AllDates: datetime.format('YYYY-MM-DDTHH:mm:ss'),
          GPSTimeStamp: datetime.format('HH:mm:ss'),
          GPSDateStamp: datetime.format('YYYY-MM-DD'),
          GPSLatitude: item.GPSLatitude,
          GPSLongitude: item.GPSLongitude,
          GPSAltitude: item.GPSAltitude,
          PoseHeadingDegrees: azimuth,
          GPSImgDirection: azimuth,
          CameraElevationAngle: item.Pitch,
          PosePitchDegrees: item.Pitch,
          ImageDescription: JSON.stringify(description),
        },
        options
      )
      .then(() => {
        console.log(`End Updating Exiftool: filename ${input_file}`);
        return resolve();
      })
      .catch((error: any) => {
        console.error(`Error in writing tags: ${input_file} - `, error);
        return resolve();
      });
  });
}

export function writeNadirImages(
  item: IGeoPoint,
  settings: any,
  description: Description
) {
  return new Promise((resolve, reject) => {
    if (settings.nadirPath !== '') {
      const filename = item.Image || '';
      const existingfile = getSequenceImagePath(settings.name, filename);
      const outputfile = getSequenceOutputPath(
        settings.name,
        filename,
        OutputType.nadir
      );
      console.log(`Start Adding Logo: filename ${filename}`);

      const addLogoAsync = addLogo(existingfile, settings.nadirPath)
        .then((image) => {
          return image.writeAsync(outputfile);
        })
        .catch((err) => {
          console.log(`Read File Error in Jimp: ${filename} - `, err);
          return reject();
        });
      const writeExifAsync = addLogoAsync
        .then(() =>
          writeExifTags(outputfile, item, {
            ...description,
            photo: { ...description.photo, uploader_nadir_added: true },
          })
        )
        .catch((err) => {
          console.error(`Add Logo Error:  ${filename} - `, err);
          return reject();
        });
      writeExifAsync
        .then(() => resolve())
        .catch((err) => {
          console.log(
            `Writing ExifTags for Image added Nadir: ${outputfile} - `,
            err
          );
          reject(err);
        });
    } else {
      return resolve();
    }
  });
}

export function writeBlurredImage(
  item: IGeoPoint,
  settings: any,
  description: Description
) {
  return new Promise((resolve, reject) => {
    const filename = item.Image || '';
    const inputfile = getSequenceImagePath(settings.name, filename);
    const outputfile = getSequenceOutputPath(
      settings.name,
      filename,
      OutputType.blur
    );

    console.log(`Start Updating Jimp: filename ${inputfile}`);
    const jimpAsync = jimp
      .read(inputfile)
      .then((image) => {
        return image.blur(10).writeAsync(outputfile);
      })
      .catch((err) => {
        console.log(`Read Error in Jimp: ${filename} - `, err);
        return reject(err);
      });
    const writeExifAsync = jimpAsync
      .then(() =>
        writeExifTags(outputfile, item, {
          ...description,
          photo: { ...description.photo, uploader_blur_added: true },
        })
      )
      .catch((err) => {
        console.log(`Write Error in Jimp: ${filename} - `, err);
        return reject(err);
      });
    writeExifAsync
      .then(() => resolve())
      .catch((err) => {
        console.log(
          `Writing ExifTags for Blurred Image: ${outputfile} - `,
          err
        );
        reject(err);
      });
  });
}

export function updateImages(points: IGeoPoint[], settings: any) {
  return new Promise((resolve, reject) => {
    const updatedPoints = points.map((p) => {
      const newP = new IGeoPoint(p);
      newP.convertStrToDate();
      return newP;
    });

    const sequenceId = uuidv4();

    const totaldistance = updatedPoints.reduce(
      (res: number, item: IGeoPoint) => {
        // eslint-disable-next-line no-param-reassign
        res += item.Distance || 0;
        return res;
      },
      0
    );

    if (updatedPoints.length === 0) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return reject('There are not images after calculating');
    }

    const durationsec = updatedPoints[updatedPoints.length - 1]
      .getDate()
      .diff(updatedPoints[0].getDate(), 'second');

    const resultjson: Result = {
      sequence: {
        id: sequenceId,
        distance_km: totaldistance / 1000,
        earliest_time: updatedPoints[0].getDateStr(),
        latest_time: updatedPoints[updatedPoints.length - 1].getDateStr(),
        durationsec,
        average_speed_kmh: durationsec
          ? (totaldistance * 3600) / durationsec
          : 0,
        uploader_sequence_name: settings.name,
        uploader_sequence_description: settings.description,
        uploader_transport_type: settings.type,
        uploader_transport_method: settings.method,
        uploader_tags: settings.tags,
        created: dayjs().format('YYYY-MM-DD'),
        uploader_camera: settings.camera,
      },
      photo: {},
    };

    const descriptions: Descriptions = {};

    updatedPoints.forEach((p: IGeoPoint, idx: number) => {
      const connections: Connections = {};
      if (idx !== 0) {
        const prevItem = updatedPoints[idx - 1];
        const deltatime = p.getDate().diff(prevItem.getDate(), 'second');
        const distance = p.Distance || 0;
        connections[prevItem.id] = {
          distance_mtrs: distance,
          heading_deg: prevItem.Azimuth || 0,
          pitch_deg: prevItem.Pitch || 0,
          time_sec: deltatime,
          speed_kmh:
            deltatime !== 0 ? (distance * 3600) / (deltatime * 1000) : 0,
        };
      }
      if (idx < updatedPoints.length - 1) {
        const nextItem = updatedPoints[idx + 1];
        const deltatime = p.getDate().diff(nextItem.getDate(), 'second');
        const distance = p.Distance || 0;
        connections[nextItem.id] = {
          distance_mtrs: distance,
          heading_deg: p.Azimuth || 0,
          pitch_deg: p.Pitch || 0,
          time_sec: deltatime,
          speed_kmh:
            deltatime !== 0 ? (distance * 3600) / (deltatime * 1000) : 0,
        };
      }
      const photodict: Photo = {
        id: p.id,
        cli_frame_rate_set: '',
        original_GPSDateTime: p.origin_GPSDateTime,
        original_altitude: p.origin_GPSAltitude,
        original_latitude: p.origin_GPSLatitude,
        original_longitude: p.origin_GPSLatitude,

        GPSDateTime: p.getDateStr(),
        GPSAltitude: p.GPSAltitude,
        GPSLatitude: p.GPSLatitude,
        GPSLongitude: p.GPSLongitude,
        Azimuth: p.Azimuth,
        Image: p.Image,
        software_version: 1.0,

        uploader_photo_from_video: settings.type === 'Video',
        uploader_nadir_added: settings.nadirPath !== '',
        uploader_blur_added: false,
        uploader_gps_modified: p.isGpsUpdated(),

        connections,
      };

      resultjson.photo[(idx + 1).toString()] = photodict;

      descriptions[p.id] = {
        photo: photodict,
        sequence: resultjson.sequence,
      };
    });

    Async.eachOfLimit(
      updatedPoints,
      4,
      (item: IGeoPoint, key: any, next: CallableFunction) => {
        const desc: Description = descriptions[item.id];
        Async.parallel(
          [
            (cb: CallableFunction) => {
              const filename = item.Image || '';
              const inputfile = getSequenceImagePath(settings.name, filename);
              const outputfile = getSequenceOutputPath(
                settings.name,
                filename,
                OutputType.raw
              );
              writeExifTags(inputfile, item, desc, outputfile)
                .then(() => cb())
                .catch((err) => cb(err));
            },
            (cb: CallableFunction) => {
              writeNadirImages(item, settings, desc)
                .then(() => cb())
                .catch((err) => {
                  if (err) {
                    cb(err);
                  }
                });
            },
            (cb: CallableFunction) => {
              writeBlurredImage(item, settings, desc)
                .then(() => cb())
                .catch((err) => cb(err));
            },
          ],
          (err) => {
            if (err) {
              next(err);
            } else {
              next();
            }
          }
        );
      },
      (err) => {
        if (err) {
          reject(err);
        } else resolve(resultjson);
      }
    );
  });
}
