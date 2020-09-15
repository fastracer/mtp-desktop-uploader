import React, { useEffect } from 'react';
import { Button, Typography } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { shell } from 'electron';
import ChevronRightRoundedIcon from '@material-ui/icons/ChevronRightRounded';

import { makeStyles } from '@material-ui/core/styles';
import { push } from 'connected-react-router';
import Logo from './Logo';
import routes from '../constants/routes.json';

import {
  setTokenWaiting,
  selTokenWaiting,
  selToken,
  selIntegrations,
  setToken,
} from '../base/slice';

const useStyles = makeStyles((theme) => ({
  content: {
    width: '100%',
    height: '100%',
    display: 'flex',
    position: 'absolute',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'wrap',
    left: '-8px',
    top: '-8px',
  },
  logoWrapper: {
    width: '100%',
    textAlign: 'center',
  },
  buttonWrapper: {
    width: '100%',
    textAlign: 'center',
  },
}));

const tokenKey = 'mtp';

export default function Login() {
  const gotoExternal = (url: string) => {
    shell.openExternal(url);
  };

  const dispatch = useDispatch();
  const tokenWaiting = useSelector(selTokenWaiting)(tokenKey);
  const token = useSelector(selToken)(tokenKey);
  const integrations = useSelector(selIntegrations);

  const classes = useStyles();

  const websiteUrl = process.env.MTP_WEB_URL || '';

  useEffect(() => {
    if (token && token !== '') {
      dispatch(push(routes.LIST));
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (!integrations[tokenKey]) {
      dispatch(push(routes.LIST));
    }
  }, [integrations, dispatch]);

  const login = () => {
    dispatch(setTokenWaiting({ waiting: true, key: tokenKey }));
    gotoExternal(integrations[tokenKey].loginUrl);
  };

  return (
    <div className={classes.content}>
      <div className={classes.logoWrapper}>
        <Logo />
      </div>
      <Typography variant="h6">
        <span>You are not logged in</span>
        <Button onClick={() => gotoExternal(websiteUrl)} color="primary">
          MTP Trekview.
        </Button>
        <span>Please login with above.</span>
      </Typography>
      <div className={classes.buttonWrapper}>
        <Button
          onClick={login}
          endIcon={<ChevronRightRoundedIcon />}
          size="large"
          color="primary"
          variant="contained"
        >
          {tokenWaiting ? 'Signing in' : 'Login'}
        </Button>
      </div>
    </div>
  );
}
