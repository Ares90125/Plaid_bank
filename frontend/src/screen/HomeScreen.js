
import React, { useState, useRef, useEffect } from 'react';
import RBSheet from "react-native-raw-bottom-sheet";
import { ImageBackground, SafeAreaView, FlatList, StyleSheet, TouchableOpacity, Text, ScrollView, Image, View, Alert } from 'react-native';
import { theme } from '../core/theme';
import Svg, { Path } from "react-native-svg";
import HomeCard from '../components/HomeCard';
import SwitchCurrency from '../components/SwitchCurrency';
import DocumentPicker from 'react-native-document-picker';
import Modal from 'react-native-modal';
import moment from 'moment';
import { useSelector, useDispatch } from 'react-redux';
import { fundBalanceApi, tranSHistoryApi, fundSHistoryApi, getAssetBalanceApi } from '../module/server/home_api';
import { transdetail } from '../redux/actions/user';
import LoadingCard from '../components/LoadingCard';
export default function HomeScreen({ navigation, onView }) {
  const handleOpenModalPress = () => setIsModalVisible(true);
  const handleCloseModalPress = () => setIsModalVisible(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
 const dispatch=useDispatch();
  const username = useSelector((store) => store.user.username);
  const sort = useSelector((store) => store.user.cash_num);
  const midprice = useSelector((store) => store.user.midprice);
  const [data, setData] = useState([]);
  const refRBSheet = useRef();
  const [singleFile, setSingleFile] = useState(null);
  const [message, setMessage] = useState('aaa');
  const [currentval, setVal] = useState('');
  useEffect(() => {
    if (sort) {
      fundBalance();
      fundSHistory();
    } else {
      getAssetBalance();
      tranSHistory();
    }
  }, [sort,midprice])
  const getAssetBalance = async () => {
    const response = await getAssetBalanceApi();
    if (response.message) {
      console.log('success');
      setVal(response.value + 'USDC');
      return;
    }
    setMessage(response.value);
    handleOpenModalPress();
  }
  const fundSHistory = async () => {
    const response = await fundSHistoryApi();
    if (response.message) {
      const mid = [];
      for (let i = 0; i < response.value.length; i++) {
        mid.push({
          id: i + 1,
          avatar: "avatar.jpg",
          name: response.value[i].userName,
          type: response.value[i]['funds-transfer-type'],
          date: new Date(response.value[i]['settled-at']),
          money: response.value[i].amount,
        });
      }
      console.log(mid);
      setData(mid);
      return;
    }
    setMessage(response.value);
    handleOpenModalPress();
  }
  const tranSHistory = async () => {
    const response = await tranSHistoryApi();
    if (response.message) {
      const mid = [];
      for (let i = 0; i < response.value.length; i++) {
        mid.push({
          id: i + 1,
          avatar: "avatar.jpg",
          name: response.value[i].userName,
          type: response.value[i]['asset-transfer-type'],
          date: response.value[i]['settled-at'],
          money: response.value[i]['unit-count'],
        });
      }
      console.log(mid);
      setData(mid);
      return;
    }
    setMessage(response.value);
    handleOpenModalPress();
  }
  const fundBalance = async () => {
    const response = await fundBalanceApi();
    if (response.message) {
      console.log('success');
      setVal('$' + response.value);
      return;
    }
    setMessage(response.value);
    handleOpenModalPress();
  }
  return (
    <ScrollView style={styles.container}>
      <ImageBackground source={require('../assets/background.png')} resizeMode="stretch" style={styles.header}>
        <View style={styles.subgroup}>
          <View style={styles.avatargroup}>
            <Image style={styles.avatar} source={require('../assets/avatar.jpg')} />
            <View style={styles.textgroup}>
              <Text style={styles.name}>Hello {username}</Text>
              <Text style={styles.welcome}>Welcome Back</Text>
            </View>
          </View>
          <View style={styles.notificationgroup}>
            <Svg
              width={27}
              height={30}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M24 17.379V12c0-4.825-3.277-8.89-7.718-10.113A2.985 2.985 0 0 0 13.5 0c-1.269 0-2.343.78-2.783 1.887C6.277 3.111 3 7.174 3 12v5.379l-2.56 2.56A1.494 1.494 0 0 0 0 21v3a1.5 1.5 0 0 0 1.5 1.5h24A1.5 1.5 0 0 0 27 24v-3a1.494 1.494 0 0 0-.44-1.06L24 17.378Zm0 5.121H3v-.879l2.56-2.56A1.494 1.494 0 0 0 6 18v-6c0-4.136 3.364-7.5 7.5-7.5S21 7.864 21 12v6c0 .399.157.78.44 1.06L24 21.622v.879ZM13.5 30a4.47 4.47 0 0 0 4.227-3H9.273a4.47 4.47 0 0 0 4.227 3Z"
                fill="#fff"
              />
            </Svg>
            <Text style={styles.notify}>
              1
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.cashwallet} onPress={() => refRBSheet.current.open()}>
          <Text style={styles.cahshtext}>{sort?'Cash':'Crypto'} Wallet</Text>
          <Svg
            width={15}
            height={9}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <Path
              d="M.311 1.211c.2-.191.47-.299.751-.299.282 0 .552.108.751.3l5.26 5.053 5.26-5.054c.2-.186.468-.289.747-.286.278.002.545.11.742.299.197.189.308.445.31.713a1 1 0 0 1-.297.718L7.824 8.43c-.2.191-.47.299-.751.299-.282 0-.552-.108-.751-.3L.312 2.656A1.001 1.001 0 0 1 0 1.933c0-.27.112-.53.311-.722Z"
              fill="#fff"
            />
          </Svg>
        </TouchableOpacity>
        <RBSheet
          ref={refRBSheet}
          height={300}
          openDuration={250}
          customStyles={{
            container: {
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 5
            }
          }}
        >
          <SwitchCurrency onPress={() => { refRBSheet.current.close() }} />
        </RBSheet>
        <Text style={styles.currentval}>
          Current Balance
        </Text>
        <Text style={styles.currentmoney}>
          {currentval}
        </Text>
      </ImageBackground>
      <View style={styles.group0}>
        <View style={styles.buttonzip}>
          <TouchableOpacity style={styles.button} onPress={async () => {
            if (sort) {
              await navigation.navigate('AddmoneyScreen');
            } else {
              await navigation.navigate('AddcashScreen');
            }
          }}>
            <Svg
              width={20}
              height={20}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M10 0a1.25 1.25 0 0 1 1.25 1.25v7.5h7.5a1.25 1.25 0 0 1 0 2.5h-7.5v7.5a1.25 1.25 0 0 1-2.5 0v-7.5h-7.5a1.25 1.25 0 0 1 0-2.5h7.5v-7.5A1.25 1.25 0 0 1 10 0Z"
                fill="#fff"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.text}>
            Add
          </Text>
        </View>
        <View style={styles.buttonzip}>
          <TouchableOpacity style={styles.button} onPress={() => { navigation.navigate('SendMoneyScreen'); }}>
            <Svg
              width={23}
              height={24}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M22.649 11.667 1.409 1.02a.406.406 0 0 0-.576.46l2.189 8.942a.401.401 0 0 0 .264.287l3.75 1.287-3.748 1.287a.398.398 0 0 0-.261.287L.833 22.524a.408.408 0 0 0 .576.46l21.24-10.588a.418.418 0 0 0 .183-.18.411.411 0 0 0-.183-.549ZM3.337 19.98l1.277-5.22 7.495-2.572a.203.203 0 0 0 0-.386l-7.495-2.57-1.272-5.2 15.945 7.996-15.95 7.952Z"
                fill="#fff"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.text}>
            Send
          </Text>
        </View>
        <View style={styles.buttonzip}>
          <TouchableOpacity style={styles.button} onPress={() => { navigation.navigate('TransferMoneyScreen'); }}>
            <Svg
              width={25}
              height={24}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="m16.25 11.961 6.25-5.98L16.25 0v4.484H0v2.99h16.25v4.487ZM25 16.447H8.75v-4.486L2.5 17.942l6.25 5.98v-4.485H25v-2.99Z"
                fill="#fff"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.text}>
            Transfer
          </Text>
        </View>
        <View style={styles.buttonzip}>
          <TouchableOpacity style={styles.button}>
            <Svg
              width={26}
              height={26}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M17.988 11.969c.66-1.125.945-2.43.813-3.727-.193-1.933-1.272-3.641-3.036-4.81l-1.197 1.805c1.212.804 1.95 1.949 2.077 3.222a4 4 0 0 1-1.16 3.235l-1.292 1.29 1.753.515c4.584 1.344 4.638 5.954 4.638 6.001h2.166c0-1.938-1.035-5.725-4.762-7.531Z"
                fill="#fff"
              />
              <Path
                d="M10.291 13a4.338 4.338 0 0 0 4.334-4.333 4.338 4.338 0 0 0-4.334-4.334 4.338 4.338 0 0 0-4.333 4.334A4.338 4.338 0 0 0 10.291 13Zm0-6.5c1.195 0 2.167.972 2.167 2.167a2.169 2.169 0 0 1-2.167 2.166 2.169 2.169 0 0 1-2.166-2.166c0-1.195.972-2.167 2.166-2.167Zm1.625 7.583h-3.25a6.507 6.507 0 0 0-6.5 6.5v1.084h2.167v-1.084a4.338 4.338 0 0 1 4.333-4.333h3.25a4.338 4.338 0 0 1 4.334 4.333v1.084h2.166v-1.084c0-3.584-2.915-6.5-6.5-6.5Z"
                fill="#fff"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.text}>
            quikbank
          </Text>
        </View>
      </View>
      {/* <View style={styles.group1}>
        <View style={styles.buttonzip}>
          <TouchableOpacity style={styles.button} onPress={() => { onView(2) }} r>
            <Svg
              width={17}
              height={25}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M3.333 13.792v5.166H.75v2.584h3.875v2.583h2.583v-2.583h2.584v2.583h2.583v-2.65c2.542-.32 4.52-2.473 4.52-5.1 0-1.705-.839-3.209-2.117-4.15a5.143 5.143 0 0 0 1.472-3.6c0-2.4-1.652-4.406-3.875-4.983V.875H9.792v2.583H7.208V.875H4.625v2.583H.75v2.584h2.583v7.75Zm8.396 5.166H5.917v-5.166h5.812a2.586 2.586 0 0 1 2.584 2.583 2.586 2.586 0 0 1-2.584 2.583ZM5.917 6.042h5.166a2.586 2.586 0 0 1 2.584 2.583 2.586 2.586 0 0 1-2.584 2.583H5.917V6.042Z"
                fill="#fff"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.text}>
            Crypto
          </Text>
        </View>
        <View style={styles.buttonzip}>
          <TouchableOpacity style={styles.button}>
            <Svg
              width={26}
              height={26}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M17.988 11.969c.66-1.125.945-2.43.813-3.727-.193-1.933-1.272-3.641-3.036-4.81l-1.197 1.805c1.212.804 1.95 1.949 2.077 3.222a4 4 0 0 1-1.16 3.235l-1.292 1.29 1.753.515c4.584 1.344 4.638 5.954 4.638 6.001h2.166c0-1.938-1.035-5.725-4.762-7.531Z"
                fill="#fff"
              />
              <Path
                d="M10.291 13a4.338 4.338 0 0 0 4.334-4.333 4.338 4.338 0 0 0-4.334-4.334 4.338 4.338 0 0 0-4.333 4.334A4.338 4.338 0 0 0 10.291 13Zm0-6.5c1.195 0 2.167.972 2.167 2.167a2.169 2.169 0 0 1-2.167 2.166 2.169 2.169 0 0 1-2.166-2.166c0-1.195.972-2.167 2.166-2.167Zm1.625 7.583h-3.25a6.507 6.507 0 0 0-6.5 6.5v1.084h2.167v-1.084a4.338 4.338 0 0 1 4.333-4.333h3.25a4.338 4.338 0 0 1 4.334 4.333v1.084h2.166v-1.084c0-3.584-2.915-6.5-6.5-6.5Z"
                fill="#fff"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.text}>
            quikbank
          </Text>
        </View>
      </View> */}
      <View style={styles.body}>
        {/* <TouchableOpacity onPress={selectFile}>
          <Text>select</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={uploadImage}>
          <Text>upload{message}</Text>
        </TouchableOpacity> */}
        <View style={styles.row}>
          <Text style={styles.recent}>
            Recent Activity
          </Text>
          <TouchableOpacity onPress={() => { onView(1) }}>
            <Text style={styles.all}>
              View All
            </Text>
          </TouchableOpacity>
        </View>
        {data.length?<FlatList style={styles.list}
          data={data}
          keyExtractor={(item) => {
            return item.id;
          }}
          renderItem={(list) => {
            const item = list.item;
            return (
              <TouchableOpacity onPress={()=>{
                dispatch(transdetail({
                  authToken:item.date,
                  midvalue:item.name,
                  midvalue2:item.type,
                  contactId:item.money
                }));
                navigation.navigate('TransactionDetailScreen');}}>
                <HomeCard item={item} />
              </TouchableOpacity>
            )
          }} />:<LoadingCard/>}
      </View>
      <Modal isVisible={isModalVisible} hasBackdrop={true} >
        <View style={styles.modal}>
          <TouchableOpacity onPress={() => {
            handleCloseModalPress()
          }} style={{ paddingHorizontal: 19, position: 'absolute', paddingTop: 19 }}>
            <Svg
              width={14}
              height={16}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M13.73 14.03a1.097 1.097 0 0 1-.15 1.583 1.19 1.19 0 0 1-.745.261 1.18 1.18 0 0 1-.897-.405L7 9.726 2.063 15.44c-.23.267-.562.405-.896.405a1.19 1.19 0 0 1-.746-.26 1.097 1.097 0 0 1-.15-1.585l5.21-6.03-5.21-5.998A1.097 1.097 0 0 1 .42.387 1.194 1.194 0 0 1 2.063.53L7 6.242 11.936.53A1.196 1.196 0 0 1 13.58.385c.495.398.562 1.107.15 1.585l-5.21 6.029 5.211 6.03Z"
                fill="#121244"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.message}>{message}</Text>
        </View>
      </Modal>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundColor,
  },
  header: {
    backgroundColor: theme.colors.backgroundColor,
    height: 350,
    display: 'flex',
    flexDirection: 'column',
  },
  subgroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 60,
    marginHorizontal: 30,
  },
  avatargroup: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 50
  },
  textgroup: {
    marginLeft: 10,
  },
  name: {
    color: theme.colors.greytextColor,
  },
  welcome: {
    color: theme.colors.whiteColor,
    fontSize: theme.fontSize.content0
  },
  notificationgroup: {
    position: 'relative'
  },
  notify: {
    overflow:'hidden',
    width: 22,
    height: 22,
    fontWeight: theme.fontWeight.bold,
    backgroundColor: theme.colors.redColor,
    borderRadius: 12,
    color: theme.colors.whiteColor,
    position: 'absolute',
    textAlign: 'center',
    justifyContent:'center',
    right: -10,
    top: -10,
  },
  cashwallet: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cahshtext: {
    color: theme.colors.whiteColor,
    fontSize: theme.fontSize.content0,
    fontWeight: theme.fontWeight.normal,
    marginRight: 10,
  },
  currentval: {
    marginTop: 20,
    textAlign: 'center',
    color: theme.colors.whiteColor,
    fontSize: theme.fontSize.subtitle01,
    fontWeight: theme.fontWeight.normal,
  },
  currentmoney: {
    marginTop: 20,
    textAlign: 'center',
    color: theme.colors.thickyellowColor,
    fontSize: theme.fontSize.title01,
    fontWeight: theme.fontWeight.normal,
  },
  group0: {
    zIndex:1,
    paddingHorizontal: '3%',
    position: 'absolute',
    width: '100%',
    top: 313,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  group1: {
    paddingHorizontal: '23%',
    position: 'absolute',
    width: '100%',
    top: 427,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buttonzip: {
    display: 'flex',
    flexDirection: 'column',
  },
  button: {
    width: 74,
    height: 74,
    backgroundColor: theme.colors.buttonYColor,
    borderRadius: 74,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    marginTop: 14,
    textAlign: 'center',
    color: theme.colors.whiteColor,
    fontSize: theme.fontSize.content0,
    fontWeight: theme.fontWeight.normal,
  },
  body: {
    paddingTop: 80,
    backgroundColor: theme.colors.backgroundColor,
  },
  row: {
    height: 60,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 17,
  },
  recent: {
    color: theme.colors.whiteColor,
    fontSize: theme.fontSize.subtitle1,
    fontWeight: theme.fontWeight.normal,
  },
  all: {
    color: theme.colors.lightgreytextColor,
    fontSize: theme.fontSize.content0,
    fontWeight: theme.fontWeight.normal,
  },
  list: {
    marginHorizontal: 17,
    backgroundColor:theme.colors.backgroundColor
  },
  modal: {
    width: '88%',
    position: 'absolute',
    bottom: 70,
    height: 200,
    marginLeft: '6%',
    borderRadius: 15,
    backgroundColor: theme.colors.whiteColor,
    borderRadius: 25,
  },
  message: {
    textAlign: 'center',
    justifyContent: 'center',
    marginTop: 75,
    color: theme.colors.backgroundColor,
    fontSize: theme.fontSize.subtitle01
  }
});
