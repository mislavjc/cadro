export type DroppedImage = {
  url: string;
  width: number;
  height: number;
  file?: File;
  name?: string;
  type?: string;
};

export type Border = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type Side = 'top' | 'right' | 'bottom' | 'left';
