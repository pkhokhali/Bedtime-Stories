import React from 'react';
import { StoryCard, type StoryCardProps } from './StoryCard';

export type StoryFormProps = StoryCardProps;

export const StoryForm: React.FC<StoryFormProps> = (props) => {
  return <StoryCard {...props} />;
};

export default StoryForm;
