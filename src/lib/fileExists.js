/**
 * @since 2016-11-27 15:36
 * @author vivaxy
 */

import fs from 'fs';

export default async filename => {
  return await new Promise(resolve => {
    fs.access(filename, err => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};
