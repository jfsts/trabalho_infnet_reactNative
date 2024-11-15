import styled from 'styled-components/native';
import { MaterialIcons } from "@expo/vector-icons";

export const Container = styled.KeyboardAvoidingView`
  flex: 1;
  background-color: #f9f9f9;
`;

export const ScrollContainer = styled.ScrollView.attrs({
  contentContainerStyle: {
    flexGrow: 1,
    padding: 20,
  },
})``;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 20px;
`;

export const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  margin-left: 10px;
  color: #333;
`;

export const Form = styled.View`
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 3.84px;
  elevation: 5;
`;

export const Label = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-top: 15px;
  margin-bottom: 5px;
`;

export const Input = styled.TextInput`
  height: 45px;
  border-color: #ddd;
  border-width: 1px;
  border-radius: 8px;
  padding: 0 15px;
  font-size: 16px;
  color: #333;
  background-color: ${props => props.editable === false ? '#f5f5f5' : '#fff'};
`;

export const ErrorContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #ffe6e6;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
`;

export const ErrorIcon = styled(MaterialIcons)`
  color: #dc3545;
`;

export const ErrorText = styled.Text`
  color: #dc3545;
  margin-left: 10px;
  font-size: 14px;
`;

export const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 30px;
`;

export const Button = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 8px;
  flex: 1;
  margin-horizontal: 5px;
  opacity: ${props => props.disabled ? 0.7 : 1};
  background-color: ${props => props.variant === 'cancel' ? '#f8f9fa' : '#6200ee'};
  border-width: ${props => props.variant === 'cancel' ? '1px' : '0'};
  border-color: ${props => props.variant === 'cancel' ? '#6c757d' : 'transparent'};
`;

export const ButtonText = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${props => props.variant === 'cancel' ? '#6c757d' : '#fff'};
`;

export const ButtonIcon = styled(MaterialIcons)`
  margin-right: 8px;
  color: ${props => props.color || '#fff'};
`;

export const LoadingIndicator = styled.ActivityIndicator.attrs({
  color: '#fff',
  size: 'small',
})``;