import React, { useState, useEffect } from 'react';
import { IpcRendererEvent } from 'electron';
import { Alert, AlertTitle } from '@material-ui/lab';

import { push } from 'connected-react-router';

import {
  Modal,
  Drawer,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  TextField,
  Grid,
  Button,
  LinearProgress,
} from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';
import dayjs from 'dayjs';

import AddIcon from '@material-ui/icons/Add';

import { useSelector, useDispatch } from 'react-redux';

import Sequence from './Sequence';
import Logo from '../components/Logo';
import Wrapper from '../components/Wrapper';
import { selLoaded, selSeqs, setEndLoad, setRemoveSeq } from './slice';

import routes from '../constants/routes.json';
import { Summary, TransportType } from '../types/Result';
import { selCameras, selConfigLoaded } from '../base/slice';

import { Camera } from '../types/Camera';
import { setEdit } from '../edit/slice';

const { ipcRenderer } = window.require('electron');

const drawerWidth = 300;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  drawerPaper: {
    width: drawerWidth,
    padding: 8,
  },
  filterWrap: {
    '& > *': {
      marginBottom: theme.spacing(2),
    },
    padding: theme.spacing(2),
  },
  gridContainer: {
    display: 'block',
  },
  modalWrapper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  alertWrapper: {
    textAlign: 'left',
  },
}));

interface State {
  name: string;
  transporttype: TransportType | '';
  model: string;
  capturedStartDate: string;
  capturedEndDate: string;
  deleteModalOpen: boolean;
  deleteSequenceName: string;
}

export default function ListPageWrapper() {
  const classes = useStyles();
  const loaded = useSelector(selLoaded);
  const configLoaded = useSelector(selConfigLoaded);

  const seqs = useSelector(selSeqs);
  const cameras = useSelector(selCameras);
  const dispatch = useDispatch();
  const [state, setState] = useState<State>({
    name: '',
    transporttype: '',
    model: '',
    capturedStartDate: '',
    capturedEndDate: '',
    deleteModalOpen: false,
    deleteSequenceName: '',
  });

  if (!loaded) {
    ipcRenderer.send('sequences');
  }

  useEffect(() => {
    ipcRenderer.once(
      'loaded_sequences',
      (_event: IpcRendererEvent, sequences: Summary[]) => {
        dispatch(setEndLoad(sequences));
      }
    );
    return () => {
      ipcRenderer.removeAllListeners('loaded_sequences');
    };
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      name: e.target.value,
    });
  };

  const handleTransportType = (
    e: React.ChangeEvent<{ name?: string; value: TransportType }>,
    _child: React.ReactNode
  ) => {
    setState({
      ...state,
      transporttype: e.target.value,
    });
  };

  const handleCameraType = (
    e: React.ChangeEvent<{ name?: string; value: TransportType }>,
    _child: React.ReactNode
  ) => {
    setState({
      ...state,
      model: e.target.value,
    });
  };

  const removeSeq = (name: string) => {
    setState({
      ...state,
      deleteModalOpen: true,
      deleteSequenceName: name,
    });
  };

  const selectSeq = (key: string) => {
    dispatch(setEdit(key));
    dispatch(push(routes.EDIT));
  };

  const onDeleteModalClose = () => {
    setState({
      ...state,
      deleteModalOpen: false,
      deleteSequenceName: '',
    });
  };

  const modalBody = (
    <div className={classes.modalWrapper}>
      <div>
        <Alert severity="warning" className={classes.alertWrapper}>
          <AlertTitle>WARNING!</AlertTitle>
          <span>
            All sequence data (including image files) will be deleted from your
            computer. Are you sure you want to delete this sequence?
          </span>
        </Alert>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Button
          onClick={() => {
            dispatch(setRemoveSeq(state.deleteSequenceName));
            ipcRenderer.send('remove_sequence', state.deleteSequenceName);
            onDeleteModalClose();
          }}
          color="secondary"
        >
          OK
        </Button>
        <Button onClick={onDeleteModalClose} color="primary">
          Cancel
        </Button>
      </div>
    </div>
  );

  const items: JSX.Element[] = [];
  seqs.forEach((item: Summary) => {
    if (
      item.name.toLowerCase().indexOf(state.name.toLowerCase()) >= 0 &&
      (state.transporttype === '' || item.type === state.transporttype) &&
      (state.model === '' || state.model === item.camera) &&
      (state.capturedStartDate === '' ||
        dayjs(state.capturedStartDate).isBefore(dayjs(item.captured))) &&
      (state.capturedEndDate === '' ||
        dayjs(state.capturedEndDate).isAfter(dayjs(item.captured)))
    ) {
      items.push(
        <Sequence
          data={item}
          key={item.id}
          onDelete={removeSeq}
          onSelect={selectSeq}
        />
      );
    }
  });

  const handleCapturedStartDate = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState({
      ...state,
      capturedStartDate: event.target.value,
    });
  };

  const handleCapturedEndDate = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState({
      ...state,
      capturedEndDate: event.target.value,
    });
  };

  return (
    <div>
      <Drawer
        open
        variant="persistent"
        anchor="left"
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <Logo />
        <div className={classes.filterWrap}>
          <Typography variant="h5"> Filters </Typography>
          <TextField
            label="Tour name search"
            fullWidth
            variant="outlined"
            value={state.name}
            onChange={handleNameChange}
            placeholder="Tour name search"
          />
          <FormControl fullWidth>
            <InputLabel id="transporttype_label_id">Transport Type</InputLabel>
            <Select
              value={state.transporttype}
              onChange={handleTransportType}
              labelId="transporttype_label_id"
            >
              <MenuItem value="">Select Transport Type</MenuItem>
              {Object.keys(TransportType).map((t: string) => (
                <MenuItem value={TransportType[t]} key={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="transporttype_label_id">
              Camera make / model
            </InputLabel>
            <Select
              value={state.model}
              onChange={handleCameraType}
              labelId="transporttype_label_id"
            >
              <MenuItem value="">Select Camera make / model</MenuItem>
              {cameras.map((t: Camera) => (
                <MenuItem value={t.name} key={t.key}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Captured Start Date"
            value={state.capturedStartDate}
            type="date"
            onChange={handleCapturedStartDate}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
          />
          <TextField
            label="Captured End Date"
            value={state.capturedEndDate}
            type="date"
            onChange={handleCapturedEndDate}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
          />
        </div>
      </Drawer>
      <Wrapper title="Browse Sequences">
        <Grid container className={classes.gridContainer}>
          {loaded && configLoaded && (
            <>
              <Grid item xs={12}>
                <Box style={{ textAlign: 'right', marginBottom: '20px' }}>
                  <Button
                    onClick={() => {
                      dispatch(push(routes.CREATE));
                    }}
                    color="primary"
                    startIcon={<AddIcon />}
                  >
                    Create
                  </Button>
                </Box>
              </Grid>
              {items.length ? (
                items
              ) : (
                <Typography>
                  No sequences exist that match the search criteria. Why not
                  create one? As if you needed an excuse for an adventure!
                </Typography>
              )}
            </>
          )}
          {(!loaded || !configLoaded) && <LinearProgress />}
        </Grid>
        <Modal open={state.deleteModalOpen} onClose={onDeleteModalClose}>
          {modalBody}
        </Modal>
      </Wrapper>
    </div>
  );
}
