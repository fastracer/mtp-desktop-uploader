import React, { ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';

import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

import IconButton from '@material-ui/core/IconButton';
import LandscapeIcon from '@material-ui/icons/Landscape';
import PoolIcon from '@material-ui/icons/Pool';
import FlightTakeoffIcon from '@material-ui/icons/FlightTakeoff';

import { setSequenceType, selSequenceType } from './slice';
import routes from '../../../constants/routes.json';

export default function SequenceType() {
  const type = useSelector(selSequenceType);
  const dispatch = useDispatch();

  const storeSequenceType = (newType: string) => {
    dispatch(setSequenceType(newType));
    dispatch(push(routes.CREATE.METHOD));
  };

  const buttons = [
    {
      component: <LandscapeIcon fontSize="large" />,
      label: 'Land',
    },
    {
      component: <PoolIcon fontSize="large" />,
      label: 'Water',
    },
    {
      component: <FlightTakeoffIcon fontSize="large" />,
      label: 'Air',
    },
  ];

  const items: ReactNode[] = [];

  buttons.forEach((it) => {
    const color = it.label === type ? 'secondary' : 'primary';
    items.push(
      <Grid item key={it.label}>
        <IconButton
          size="medium"
          color={color}
          onClick={() => storeSequenceType(it.label)}
        >
          {it.component}
        </IconButton>
        <Typography color={color}>{it.label}</Typography>
      </Grid>
    );
  });

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" align="center" color="textSecondary">
          Where did you capture content?
        </Typography>
      </Grid>
      <Grid item xs={12} style={{ paddingBottom: '30px' }}>
        <Grid container spacing={5} justify="center">
          {items}
        </Grid>
      </Grid>
      <Grid item xs={12} style={{ paddingBottom: '30px' }} />
    </>
  );
}
