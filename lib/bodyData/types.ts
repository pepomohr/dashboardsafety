// Tipo de los datos del cuerpo (portado de react-native-body-highlighter, MIT)
export interface BodyPart {
  color?: string
  slug?: string
  path?: {
    common?: string[]
    left?: string[]
    right?: string[]
  }
}
