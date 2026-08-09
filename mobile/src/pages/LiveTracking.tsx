import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

export const LiveTracking: React.FC = () => {
  return (
    <View style={tw('flex-1 bg-slate-950 justify-center items-center')}>
      <Text style={tw('text-white text-lg font-bold')}>LiveTracking Placeholder</Text>
    </View>
  );
};

