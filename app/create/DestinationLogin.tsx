import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { shell } from 'electron';

import { Typography, Grid, Button } from '@material-ui/core';

import { selSequence, setProcessStep, selError, selDestination } from './slice';
import {
  setTokenWaiting,
  selIntegrations,
  selTokens,
  setToken,
} from '../base/slice';

const { ipcRenderer } = window.require('electron');

export default function DestinationLogin() {
  const dispatch = useDispatch();
  const destination = useSelector(selDestination);
  const integrations = useSelector(selIntegrations);
  const sequence = useSelector(selSequence);
  const tokens = useSelector(selTokens);
  const error = useSelector(selError);

  useEffect(() => {
    if (
      Object.keys(destination).filter(
        (integration: string) =>
          !(tokens[integration] && tokens[integration].value)
      ).length === 0 &&
      !error
    ) {
      dispatch(setProcessStep('name'));
      ipcRenderer.send('update_images', sequence);
    }
  }, [dispatch, tokens, sequence, destination, error]);

  const gotoExternal = (url: string) => {
    shell.openExternal(url);
  };

  const login = (integration: string) => {
    dispatch(setTokenWaiting({ waiting: true, key: integration }));

    gotoExternal(integrations[integration].loginUrl);
  };

  const items = Object.keys(destination)
    .filter(
      (integration: string) => destination[integration] && integration !== 'mtp'
    )
    .map((integration: string) => {
      const integrationLogo = (
        <img
          src={`data:image/png;base64, ${integrations[integration].logo}`}
          alt={integrations[integration].name}
          width="70"
          height="70"
        />
      );
      return (
        <Button
          onClick={() => login(integration)}
          endIcon={integrationLogo}
          size="large"
          color="primary"
          variant="contained"
          key={integration}
        >
          {tokens[integration].waiting ? 'Logining to' : 'Login to'}
        </Button>
      );
    });

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6">Authentications</Typography>
      </Grid>
      <Grid item xs={12} />
      <Grid item xs={12}>
        {items}
      </Grid>
    </>
  );
}
