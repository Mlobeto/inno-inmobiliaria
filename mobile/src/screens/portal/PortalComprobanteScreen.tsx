import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { subirComprobante, clearPortalError } from '../../store/portalSlice';
import { AppDispatch, RootState } from '../../store/store';
import { PortalStackParamList } from '../../navigation/PortalNavigator';

type RouteType = RouteProp<PortalStackParamList, 'SubirComprobante'>;

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function formatPeriod(period: string) {
  if (period?.includes('-')) {
    const [y, m] = period.split('-');
    return `${MONTHS[parseInt(m, 10) - 1] ?? m} ${y}`;
  }
  return period;
}

export const PortalComprobanteScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { receiptId, period } = route.params;

  const { isLoading, error } = useSelector((state: RootState) => state.portal);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('comprobante.jpg');
  const [imageMime, setImageMime] = useState<string>('image/jpeg');

  const requestAndPick = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para continuar.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para continuar.');
        return;
      }
    }

    const result = await (source === 'camera'
      ? ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: true,
          aspect: [3, 4],
        })
      : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: true,
          aspect: [3, 4],
        }));

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);

      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      setImageMime(mime);
      setImageName(`comprobante_${receiptId}_${Date.now()}.${ext}`);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert('Sin imagen', 'Por favor seleccioná o tomá una foto del comprobante.');
      return;
    }
    try {
      await dispatch(
        subirComprobante({ receiptId, fileUri: imageUri, fileName: imageName, mimeType: imageMime })
      ).unwrap();
      Alert.alert('¡Listo!', 'Tu comprobante fue enviado y está en revisión.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err || 'No se pudo subir el comprobante');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Comprobante de pago</Text>
        <Text style={styles.infoPeriod}>{formatPeriod(period)}</Text>
        <Text style={styles.infoHint}>
          Tomá una foto o seleccioná tu comprobante del banco/transferencia.
          Será revisado por la administración.
        </Text>
      </View>

      {/* Image selection */}
      {!imageUri ? (
        <View style={styles.pickerButtons}>
          <TouchableOpacity
            style={[styles.pickerBtn, styles.cameraBtn]}
            onPress={() => requestAndPick('camera')}
          >
            <Text style={styles.pickerBtnIcon}>📷</Text>
            <Text style={styles.pickerBtnText}>Usar cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerBtn, styles.galleryBtn]}
            onPress={() => requestAndPick('gallery')}
          >
            <Text style={styles.pickerBtnIcon}>🖼️</Text>
            <Text style={styles.pickerBtnText}>Desde galería</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
          <TouchableOpacity style={styles.changeBtn} onPress={() => setImageUri(null)}>
            <Text style={styles.changeBtnText}>Cambiar imagen</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      ) : null}

      {/* Upload button */}
      {imageUri && (
        <TouchableOpacity
          style={[styles.uploadBtn, isLoading && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadBtnText}>Enviar comprobante</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => {
          dispatch(clearPortalError());
          navigation.goBack();
        }}
      >
        <Text style={styles.backBtnText}>← Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { padding: 20, paddingBottom: 40 },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 4 },
  infoPeriod: { fontSize: 22, fontWeight: '800', color: '#16a34a', marginBottom: 8 },
  infoHint: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  pickerButtons: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  pickerBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  cameraBtn: { backgroundColor: '#fff' },
  galleryBtn: { backgroundColor: '#fff' },
  pickerBtnIcon: { fontSize: 32, marginBottom: 8 },
  pickerBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  previewContainer: { alignItems: 'center', marginBottom: 24 },
  preview: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#e5e7eb' },
  changeBtn: { marginTop: 10 },
  changeBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: '#b91c1c', fontSize: 14 },
  uploadBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadBtnDisabled: { backgroundColor: '#86efac' },
  uploadBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backBtn: { alignItems: 'center', marginTop: 8 },
  backBtnText: { color: '#6b7280', fontSize: 14 },
});
