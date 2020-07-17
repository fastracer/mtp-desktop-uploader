import { createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
// eslint-disable-next-line import/no-cycle
import { AppThunk, RootState } from '../../store';
import { IGeoPoint } from '../../types/IGeoPoint';
import { getDistance } from '../../scripts/utils';

const createSequenceSlice = createSlice({
  name: 'create',
  initialState: {
    currentStep: 'name',
    steps: {
      name: '',
      description: '',
      type: '',
      method: '',
      camera: '',
      attachType: '',
      imagePath: '',
      gpxPath: '',
      startTime: '',
      modifyTime: 0,
      modifySpace: '',
      tags: [],
      nadir: '',
      nadirPath: '',
      previewNadir:
        '/home/aa/Works/Rudy/David/Test/TIMELAPSE/MULTISHOT_9698_000001.jpg',
      processPage: {
        process: 0,
        nextStep: '',
      },
    },
    points: [],
  },
  reducers: {
    setCurrentStep: (state, { payload }) => {
      state.currentStep = payload;
    },
    setName: (state, { payload }) => {
      state.steps.name = payload;
    },
    setDescription: (state, { payload }) => {
      state.steps.description = payload;
    },
    setType: (state, { payload }) => {
      state.steps.type = payload;
    },
    setMethod: (state, { payload }) => {
      state.steps.method = payload;
    },
    setCamera: (state, { payload }) => {
      state.steps.camera = payload;
    },
    setAttachType: (state, { payload }) => {
      state.steps.attachType = payload;
    },
    setImagePath: (state, { payload }) => {
      state.steps.imagePath = payload;
    },
    setGpxPath: (state, { payload }) => {
      state.steps.gpxPath = payload;
    },
    setStartTime: (state, { payload }) => {
      state.steps.startTime = payload;
    },
    setModifyTime: (state, { payload }) => {
      state.steps.modifyTime = payload;
    },
    setTags: (state, { payload }) => {
      state.steps.tags = payload;
    },
    setNadirPath: (state, { payload }) => {
      state.steps.nadirPath = payload;
    },
    setProgress: (state, { payload }) => {
      state.steps.processPage = {
        ...state.steps.processPage,
        process: payload,
      };
    },
    setProcessStep: (state, { payload }) => {
      state.steps.processPage = {
        process: 0,
        nextStep: payload,
      };
      state.currentStep = 'processPage';
    },
    setPoints: (state, { payload }) => {
      state.points = [
        ...payload.map((item) => {
          return {
            GPSDateTime: item.GPSDateTime,
            GPSLatitude: item.GPSLatitude,
            GPSLongitude: item.GPSLongitude,
            Image: item.Image,
          };
        }),
      ];
    },
    setGpxPoints: (state, { payload }) => {
      const points = state.points.map((p, idx) => {
        p.GPSDateTime = payload[idx].timestamp;
        p.GPSLongitude = payload[idx].longitude;
        p.GPSLatitude = payload[idx].latitude;
        return p;
      });
      state.points = [...points];
    },
    setModifyPoints: (state, { payload }) => {
      const points = state.points.map((item) => {
        const updatedDate = dayjs(item.GPSDateTime)
          .add(payload, 'second')
          .format('YYYY-MM-DDTHH:mm:ss');
        item.GPSDateTime = updatedDate;
        return item;
      });
      state.points = [...points];
    },
    smoothPoints: (state, { payload }) => {
      const points = state.points.map((item, idx) => {
        if (idx === 0 && idx === state.points.length - 1) {
          return item;
        }
        const prevItem = state.points[idx - 2];
        const nextItem = state.points[idx];
        if (
          getDistance(prevItem, item) > payload &&
          getDistance(nextItem, item) > payload
        ) {
          return {
            ...item,
            GPSLongitude: (prevItem.GPSLongitude + nextItem.GPSLongitude) / 2,
            GPSLatitude: (prevItem.GPSLatitude + nextItem.GPSLatitude) / 2,
          };
        }
        return item;
      });
      state.points = [...points];
    },
    discardPoints: (state, { payload }) => {
      const points = state.points.filter((item, idx) => {
        if (idx === 0 && idx === state.points.length - 1) {
          return true;
        }
        const prevItem = state.points[idx - 1];
        const nextItem = state.points[idx + 1];
        if (
          getDistance(prevItem, item) > payload &&
          getDistance(nextItem, item) > payload
        ) {
          return false;
        }
        return true;
      });
      state.points = [...points];
    },
  },
});

export const {
  setName,
  setDescription,
  setType,
  setMethod,
  setCamera,
  setAttachType,
  setCurrentStep,
  setImagePath,
  setGpxPath,
  setStartTime,
  setModifyTime,
  setTags,
  setNadirPath,
  setProgress,
  setProcessStep,
  setPoints,
  setGpxPoints,
  setModifyPoints,
  smoothPoints,
  discardPoints,
} = createSequenceSlice.actions;

export const setSequenceName = (name: string): AppThunk => {
  return (dispatch) => {
    dispatch(setName(name));
    dispatch(setCurrentStep('description'));
  };
};

export const setSequenceDescription = (description: string): AppThunk => {
  return (dispatch) => {
    dispatch(setDescription(description));
    dispatch(setCurrentStep('type'));
  };
};

export const setSequenceType = (type: string): AppThunk => {
  return (dispatch) => {
    dispatch(setType(type));
    dispatch(setCurrentStep('method'));
  };
};

export const setSequenceMethod = (method: string): AppThunk => {
  return (dispatch) => {
    dispatch(setMethod(method));
    dispatch(setCurrentStep('camera'));
  };
};

export const setSequenceCamera = (camera: string): AppThunk => {
  return (dispatch) => {
    dispatch(setCamera(camera));
    dispatch(setCurrentStep('attachType'));
  };
};

export const setSequenceAttachType = (attachType: string): AppThunk => {
  return (dispatch) => {
    dispatch(setAttachType(attachType));
    dispatch(setCurrentStep('imagePath'));
  };
};

export const setSequenceCurrentStep = (currentStep: string): AppThunk => {
  return (dispatch) => {
    dispatch(setCurrentStep(currentStep));
  };
};

export const setSequenceImagePath = (uploadPath: string): AppThunk => {
  return (dispatch) => {
    dispatch(setImagePath(uploadPath));
    dispatch(setProcessStep('gpxPath'));
  };
};

export const setSequenceGpxPath = (uploadPath: string): AppThunk => {
  return (dispatch) => {
    dispatch(setGpxPath(uploadPath));
  };
};

export const setSequenceStartTime = (startTime: string): AppThunk => {
  return (dispatch) => {
    dispatch(setStartTime(startTime));
  };
};

export const setSequenceModifyTime = (modifyTime: number): AppThunk => {
  return (dispatch) => {
    dispatch(setModifyTime(modifyTime));
    dispatch(setModifyPoints(modifyTime));
    dispatch(setCurrentStep('modifySpace'));
  };
};

export const setSequenceNadirPath = (paths: string): AppThunk => {
  return (dispatch) => {
    dispatch(setNadirPath(paths));
    dispatch(setCurrentStep('previewNadir'));
  };
};

export const setSequenceTags = (tags: string[]): AppThunk => {
  return (dispatch) => {
    dispatch(setTags(tags));
    dispatch(setCurrentStep('nadir'));
  };
};

export const setSequenceProcess = (process: number): AppThunk => {
  return (dispatch) => {
    dispatch(setProgress(process));
  };
};

export const setSequencePoints = (points: IGeoPoint): AppThunk => {
  return (dispatch) => {
    dispatch(setPoints(points));
  };
};

export const setSequenceGpxPoints = (points: any[]): AppThunk => {
  return (dispatch) => {
    dispatch(setGpxPoints(points));
    if (points.length) {
      dispatch(setStartTime(points[0].timestamp));
    }
    dispatch(setCurrentStep('startTime'));
  };
};

export const setSequenceSmothPoints = (meters: number): AppThunk => {
  return (dispatch) => {
    dispatch(smoothPoints(meters));
  };
};

export const setSequenceDiscardPoints = (meters: number): AppThunk => {
  return (dispatch) => {
    dispatch(discardPoints(meters));
  };
};

export default createSequenceSlice.reducer;

export const selSequenceName = (state: RootState) => state.create.steps.name;

export const selSequenceDescription = (state: RootState) =>
  state.create.steps.description;

export const selSequenceType = (state: RootState) => state.create.steps.type;

export const selSequenceMethod = (state: RootState) =>
  state.create.steps.method;

export const selSequenceCamera = (state: RootState) =>
  state.create.steps.camera;

export const selSequenceAttachType = (state: RootState) =>
  state.create.steps.attachType;

export const getPrevStep = (state: RootState) => {
  if (state.create.currentStep === 'processPage') return '';
  const pages = Object.keys(state.create.steps);

  const idx = pages.indexOf(state.create.currentStep);
  if (idx - 1 < 0) {
    return '';
  }
  return pages[idx - 1];
};

export const selStartTime = (state: RootState) => state.create.steps.startTime;
export const selModifyTime = (state: RootState) =>
  state.create.steps.modifyTime;

export const selSequenceTags = (state: RootState) => state.create.steps.tags;

export const selPoints = (state: RootState) => state.create.points;

export const selProgress = (state: RootState) =>
  state.create.steps.processPage.process;

export const selProgressNextStep = (state: RootState) =>
  state.create.steps.processPage.nextStep;

export const selNadirImage = (state: RootState) =>
  state.create.steps.previewNadir;

export const selCurrentStep = (state: RootState) => state.create.currentStep;

export const selSequence = (state: RootState) => state.create;