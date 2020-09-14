import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Grid, Button, Box, Typography } from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';

import Map from '../components/Map';

import { setCurrentStep, selPoints, isRequiredNadir } from './slice';

const useStyles = makeStyles((theme) => ({
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    '& > *': {
      margin: theme.spacing(2),
    },
  },
  buttonWrapper: {
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'center',
    '& > *': {
      margin: theme.spacing(1),
    },
  },
}));

export default function RequireModify() {
  const dispatch = useDispatch();

  const points = useSelector(selPoints);

  const nadir = useSelector(isRequiredNadir);

  const classes = useStyles();

  const confirmMode = () => {
    if (nadir) {
      dispatch(setCurrentStep('nadir'));
    } else {
      dispatch(setCurrentStep('blur'));
    }
  };

  const requireModify = () => {
    dispatch(setCurrentStep('modifySpace'));
  };

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" align="center" color="textSecondary">
          Confirmation Page
        </Typography>
        <Typography paragraph>
          Your all images or video are geotagged.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Map points={points} />
      </Grid>
      <Grid item xs={12}>
        <Box className={classes.buttonWrapper}>
          <Button
            endIcon={<ChevronRightIcon />}
            color="secondary"
            onClick={requireModify}
            variant="contained"
          >
            Make Changes
          </Button>
          <Button
            endIcon={<ThumbUpIcon />}
            color="primary"
            onClick={confirmMode}
            variant="contained"
          >
            Looks good!
          </Button>
        </Box>
      </Grid>
    </>
  );
}