import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

import { Button } from '@material-ui/core';
import {
  setSequenceGpxPath,
  setCurrentStep,
  selGPXRequired,
  selGPXImport,
  setProcessStep,
  setSequencePoints,
  selPoints,
  setError,
} from './slice';

import { IGeoPoint } from '../types/IGeoPoint';

const { ipcRenderer, remote } = window.require('electron');

export default function SequenceUploadGpx() {
  const dispatch = useDispatch();
  const proppoints = useSelector(selPoints);

  const required = useSelector(selGPXRequired);
  const importgpx = useSelector(selGPXImport);

  useEffect(() => {
    if (!required && !importgpx && proppoints.length) {
      dispatch(setCurrentStep('modifySpace'));
    }
  });

  const openFileDialog = async () => {
    const parentWindow = remote.getCurrentWindow();
    const result = await remote.dialog.showOpenDialogSync(parentWindow, {
      properties: ['openFile'],
      filters: [
        {
          name: 'GPX',
          extensions: ['gpx'],
        },
      ],
    });
    if (result) {
      dispatch(setSequenceGpxPath(result[0]));
      dispatch(setProcessStep('startTime'));
      ipcRenderer.send('load_gpx', result[0]);
    }
  };

  const geotagged = proppoints.filter(
    (p: IGeoPoint) =>
      typeof p.MAPAltitude !== 'undefined' &&
      typeof p.MAPLatitude !== 'undefined' &&
      typeof p.MAPLongitude !== 'undefined'
  );

  const discardPoints = () => {
    dispatch(setSequencePoints(geotagged));
    if (geotagged.length) {
      dispatch(setCurrentStep('modifySpace'));
    } else {
      dispatch(setError('There will be no images.'));
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" align="center" color="textSecondary">
          {`${
            required ? 'There are some images that have no geodata.' : ' .'
          }Please upload the GPS tracks Following formats supported: GPX.`}
        </Typography>
      </Grid>
      <Grid
        item
        xs={12}
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-around',
        }}
      >
        <div>
          <Button
            onClick={openFileDialog}
            color="primary"
            variant="contained"
            endIcon={<CloudUploadIcon />}
          >
            Upload
          </Button>
        </div>
        {!importgpx && geotagged.length > 0 && (
          <div>
            <Button
              onClick={discardPoints}
              color="secondary"
              endIcon={<DeleteForeverIcon />}
              variant="contained"
            >
              Discard
            </Button>
          </div>
        )}
      </Grid>
      <Grid item xs={12} />
    </>
  );
}
