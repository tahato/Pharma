import { ImageBackground } from "expo-image";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchInput from "../../components/SearchInput";
import images from "../../constants/images";

export default function vente() {
  const [visible, seVisible] = useState(false);
  const table = [1, 2, 3];
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ImageBackground
        className="relative"
        source={images.identifier}
        contentFit="cover"
        style={{ flex: 1, position: "relative", backgroundColor: "#f0f0f0" }}
      >
        <View style={{ marginTop: 20 }}>
          <SearchInput />
          <View style={{ marginTop: 10 }}>
            <View style={[styles.row, { backgroundColor: "white" }]}>
              <Text style={{ flex: 1 }}>Produit</Text>
              <View style={styles.rightRow}>
                <Text>Prix</Text>
                <Text style={{ width: "50%" }}>Quantitée</Text>
              </View>
            </View>
            {table.map((i) => (
              <TouchableOpacity
                onLongPress={() => seVisible(true)}
                key={i}
                style={[
                  styles.row,
                  { backgroundColor: i % 2 == 0 ? "white" : "lightgray" },
                ]}
              >
                <Text style={{ flex: 1 }}>{i}</Text>
                <View style={styles.rightRow}>
                  <Text>120</Text>
                  <Text style={{ width: "50%" }}> 2</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.total}>
          <View className="flex-row ">
            {/* <Text className="text-white text-2xl font-bold">Total: </Text> */}
            <Text style={{ color: "#00FF00", fontSize: 16, fontWeight: "bold",padding:5 }}>
              720.00 DA
            </Text>
          </View>
          <View className="flex-row ">
            {/* <Text className="text-white text-lg font-semibold">Quantité: </Text> */}
            <Text style={{ color: "#00FF00", fontSize: 16, fontWeight: "bold",padding:5 }}>
              {" "}
              X 06
            </Text>
          </View>
        </View>
        <Modal transparent={true} visible={visible} animationType="slide">
          <View className="flex-1 bg-transparent justify-center items-center">
            <View className="bg-white flex-col p-10 gap-5 w-[90%] rounded-xl items-center">
              {/* <Text>logoutMsg</Text> */}
              <View className="flex-row  justify-between w-[80%]">
                <TouchableOpacity
                  className="rounded-full p-5"
                  onPress={() => {
                    seVisible(false);
                  }}
                  activeOpacity={1}
                >
                  <Text>Dlete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={1}
                  className="p-5 rounded-full"
                >
                  <Text>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
}

//  <Text className="flex-1 border-r-2  border-gray-500">

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    width: "100%",
    gap: 5,
    padding: 5,
    paddingHorizontal: 10,
    alignContent: "center",
  },

  rightRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "50%",
  },
  total: {
    backgroundColor: "black",
    borderColor: "#50C878",
    borderWidth: 2,
    // borderRadius: 50,
    position: "absolute",
    bottom: 5,
    right: 4,
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  totalText: {},
});
