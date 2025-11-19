import { Stack } from 'expo-router'
import { StyleSheet } from 'react-native'

export default function _layout() {
    return (
        <Stack>
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack>
    )
}

const styles = StyleSheet.create({})