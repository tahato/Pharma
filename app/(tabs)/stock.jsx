import { ImageBackground } from "expo-image";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MedecineCard from "../../components/MedecineCard";
import SearchInput from "../../components/SearchInput";
import images from "../../constants/images";
import { router } from "expo-router";

export default function stock() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ImageBackground
        source={images.identifier}
        contentFit="cover"
        style={{ flex: 1, position: "relative", backgroundColor: "#f0f0f0" }}
      >
        <Text style={styles.title}> Stock </Text>

        <FlatList
          className=" h-full"
          data={[1, 2, 3]}
          // keyExtractor={}
          renderItem={() => <MedecineCard />}
          ListHeaderComponent={() => (
            <View style={styles.headerContainer}>
              <SearchInput />
              <TouchableOpacity
              style={styles.button}
                onPress={() => router.push("/addProducts")}
              >
                <Text style={{color:'white',fontSize:22,fontWeight:'bold'}} >+</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding:5,
    marginBottom:10
  },
  title: {
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
    margin: 10,
  },
  button: {
    height: 30,
    width: 30,
    display:'flex',
    backgroundColor: "blue",
    justifyContent: "center",
    alignItems: "center",
    borderRadius:'100%'
  },
});
