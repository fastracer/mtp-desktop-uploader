export enum TransportType {
  Land = 'Land',
  Water = 'Water',
  Air = 'Air',
}

export interface Sequence {
  id: string;
  distance_km: number;
  earliest_time?: string;
  latest_time?: string;
  durationsec: number;
  average_speed_kmh: number;
  uploader_sequence_name: string;
  uploader_sequence_description: string;
  uploader_transport_type: TransportType;
  uploader_transport_method: string;
  uploader_camera: string;
  uploader_tags: string[];
  created: string;
}

export interface Connection {
  distance_mtrs: number;
  heading_deg: number;
  pitch_deg: number;
  time_sec: number;
  speed_kmh: number;
}

export interface Connections {
  [key: string]: Connection;
}

export interface Photo {
  GPSDateTime?: string;
  MAPAltitude?: number;
  MAPLatitude?: number;
  MAPLongitude?: number;

  MAPCaptureTime: string;
  MTPSequenceName: string;
  MTPSequenceDescription: string;
  MTPSequenceTransport: string;
  MTPSequenceTags: string[];
  MTPImageCopy: string;
  MTPImageProjection: string;
  MTPUploaderPhotoUUID: string;
  MTPUploaderSequenceUUID: string;

  connections?: Connections;
}

export interface Export {
  filename?: string;
  GPSDateTime?: string;
  originalDateTime: string;
  altitude?: number;
  latitude?: number;
  longitude?: number;
  gps_direction_ref?: string;
  gps_speed?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
  camera_make?: string;
  camera_model?: string;
  projection: string;
}

export interface ExportPhoto {
  original: Export;
  modified: Export;
  connections?: Connections;
}

export interface Photos {
  [key: string]: ExportPhoto;
}

export interface Result {
  sequence: Sequence;
  photo: Photos;
}

export interface Description {
  photo: Photo;
  sequence: Sequence;
}

export interface Descriptions {
  [key: string]: Description;
}

export interface Results {
  [key: string]: Result;
}

export interface Summary {
  id: string;
  tags: string[];
  name: string;
  description: string;
  type: TransportType;
  method: string;
  points: Photo[];
  created: string;
  captured: string;
  total_km: number;
  camera: string;
}
