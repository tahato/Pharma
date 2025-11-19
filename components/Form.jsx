// import { setItem } from "@/tools/AsyncStorage"
import axios from 'axios'
import { Image } from 'expo-image'
import { router } from "expo-router"
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
// import icons from "../constants/icons"
import images from "../constants/images"
import { FontAwesome5 } from '@expo/vector-icons'
// import styles from "../styles/index"


export default function Form({screen}) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [code, setCode] = useState('')
    const [error, setError] = useState(false)
    // const API_URL = process.env.EXPO_PUBLIC_API_URL;
    const [showPassword, setShowPassword] = useState(false)

    const handleLogin = async () => {
        // if (email == '' || password == '' || code == '') {
        //     setError(true)
        // } else {

        //     await axios
        //         .post(`${API_URL}/api/login`, { username: email, password, company_code: code })
        //         .then((res) => {
        //             setItem('token', res.data.access_token)
        //             setItem('user', res.data.user)
        //             setItem('school', res.data.company_app)
        //             router.replace('./(home)')
        //         })
        //         .catch((err) => {
        //             console.log(err);
        //             setError(true)
        //         });
        // }
    }
    return (

        // <View className='bg-white w-[75%] flex flex-col items-center justify-center px-5 m-5 gap-5 max-w-600 rounded-[20] '>
        <View style={styles.form}>
            <Image source={images.mainLogo} style={styles.logoImage} contentFit='contain' />
            <Text style={styles.welcomText}>{t('welcome')}</Text>
            <View style={styles.logform}>
                <View style={styles.formField}>
                    <Text style={styles.label}>{t('username')}</Text>
                    <TextInput className="text-black bg-white"
                        // keyboardType='email'
                        value={email}
                        style={[styles.input, error && { borderColor: 'red' }]}
                        onChangeText={e => setEmail(e)}

                    />
                </View>
             
                <View style={styles.formField}>
                    <Text style={styles.label}>{t('psw')}</Text>
                    <TextInput 
                        style={[styles.input, error && { borderColor: 'red' }]}
                        value={password}
                        onChangeText={e => setPassword(e)}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                    className="absolute  p-2"
                        onPress={() => setShowPassword(!showPassword)} >
                       <FontAwesome5 name={showPassword ?'eye-slash': 'eye'}/>
                    </TouchableOpacity>
                </View>
                {
                    screen=="register" &&(

                <View style={styles.formField}>
                    <Text style={styles.label}>{t('Cpsw')}</Text>
                    <TextInput 
                        style={[styles.input, error && { borderColor: 'red' }]}
                        value={password}
                        onChangeText={e => setPassword(e)}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                    className="absolute  p-2"
                        onPress={() => setShowPassword(!showPassword)} >
                       <FontAwesome5 name={showPassword ?'eye-slash': 'eye'}/>
                    </TouchableOpacity>
                </View>
                    )
                }
            </View>
            <TouchableOpacity activeOpacity={0.9} style={styles.btnConnect} onPress={handleLogin} >
                <Text style={styles.btnText}>{screen=='register'? t('register'): t('login')}</Text>
            </TouchableOpacity>
            <Text style={styles.bottomText}>
            <Text style={{ color: "blue"}} onPress={()=>{router.replace(screen=="register" ?'login':'register')}}>{   screen=="register" ? 'Already have an account? Sign-in':"Didn't have an account? Register"}</Text>
            </Text>
        </View>

    )
}
const styles = StyleSheet.create({
     form: {
        width: "85%",
        backgroundColor: "white",
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        paddingHorizontal: 20,
        elevation: 7
    },

    logoImage: {
        width: "60%",
        height: "20%",
    },
    welcomText: {
        fontSize: 16,
        color: "black",
        fontFamily: "Jura"
    },

    logform: {
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        marginVertical: 20

    },
    formField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10
    },
    input: {
        paddingHorizontal: 10,
        borderColor:"gray",
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 3,
        height: 35,
        fontSize: 12,
        paddingVertical: 0,
        fontFamily: "jura",
        flex: 1,
        backgroundColor:"white",
        color:'black'
    },
    label: {
        textTransform: 'capitalize',
        color:"black",
        fontSize: 12,
        width: "35%",
        fontFamily: "jura",
        textAlign: "right",
    },
    btnConnect: {
        marginTop: 10,

        width: "100%",
        padding: 10,
        backgroundColor:"lightblue",
        borderRadius: 5,
    },
    btnText: {
        color: 'black',
        fontSize: 16,
        fontFamily: 'Jura-bold',
        textAlign: 'center'
    },
    bottomText: {
        // color: colors.bigTitleGray,
        fontSize: 10,
        // fontFamily: fonts.mainFont,
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 10
    },
    inputs: {
        // paddingHorizontal: 5, 
        // borderColor: colors.titleGray,
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 3,
        width: 152,
        height: 25,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 3,
    },
  
    // errorMessage: {
    //     color: "red",
    //     fontSize: 10,
    //     fontFamily: fonts.mainFont,
    //     alignSelf: "flex-end",
    //     paddingRight: "10%"
    // },
    headerLeftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "center",
    },
    headerLeftText: {
        fontSize: 10,
        // fontFamily: fonts.mainFont,
        // color: colors.mainGolden,
        fontWeight: 'bold',
        marginLeft: 10,
        zIndex: 999,
        elevation: 7
    },
})
