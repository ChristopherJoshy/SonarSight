interface SnackbarNotificationProps {
  visible: boolean;
  message: string;
}

export default function SnackbarNotification({ visible, message }: SnackbarNotificationProps) {
  if (!visible) return null;
  
  return (
    <div 
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg flex items-center space-x-2 z-50 opacity-100 transition-opacity duration-300"
    >
      <i className="fas fa-check-circle text-green-400"></i>
      <span>{message}</span>
    </div>
  );
}
