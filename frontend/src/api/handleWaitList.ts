import axiosInstance from '../lib/axios';

interface WaitListData {
  email: string;
  name: string;
  position: string;
  use_case: string;
}

export const handleWaitList = async (data: WaitListData): Promise<void> => {
  try {
    const response = await axiosInstance.post('/waitlist/submit', data);

    if (!response.data.success) {
      throw new Error('Failed to submit waitlist entry');
    }

    console.log('Waitlist submission successful:', response.data);
  } catch (error) {
    console.error('Error submitting to waitlist:', error);
    throw error;
  }
};
