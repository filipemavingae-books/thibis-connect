import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Eye, 
  EyeOff, 
  Shield, 
  Sparkles, 
  Lock, 
  UserCheck, 
  Fingerprint,
  Globe,
  Smartphone,
  Mail,
  Key,
  CheckCircle,
  AlertTriangle,
  Star,
  Zap,
  Camera,
  FileText,
  User,
  AtSign,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { v4 as uuidv4 } from 'uuid';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [signUpStep, setSignUpStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nome: "",
    nomeUsuario: "",
    genero: "",
    profilePhoto: null as File | null,
    documentPhoto: null as File | null,
    uuid: uuidv4(),
  });

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { fingerprint, loading: fpLoading, isDeviceRegistered, registerDevice } = useDeviceFingerprint();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !showOtpInput) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, showOtpInput]);

  // Check device registration on component mount
  useEffect(() => {
    if (fingerprint && !fpLoading) {
      const registeredEmails = JSON.parse(localStorage.getItem('thibis_device_emails') || '[]');
      if (registeredEmails.length > 0 && !isDeviceRegistered(fingerprint.id)) {
        setDeviceBlocked(true);
      }
    }
  }, [fingerprint, fpLoading, isDeviceRegistered]);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (password: string) => {
    setSignUpData(prev => ({ ...prev, password }));
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const checkDeviceSecurity = async (email: string): Promise<boolean> => {
    if (!fingerprint) return false;

    // Check if this device already has an account registered
    const deviceEmails = JSON.parse(localStorage.getItem('thibis_device_emails') || '[]');
    
    if (deviceEmails.length > 0 && !deviceEmails.includes(email)) {
      throw new Error('Este dispositivo já possui uma conta registrada. Por segurança, apenas uma conta por dispositivo é permitida.');
    }

    // Register this email with this device
    if (!deviceEmails.includes(email)) {
      deviceEmails.push(email);
      localStorage.setItem('thibis_device_emails', JSON.stringify(deviceEmails));
    }

    registerDevice(fingerprint.id);
    return true;
  };

  const uploadFile = async (file: File, bucket: string, folder: string = "") => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}${Date.now()}-${signUpData.uuid}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;
    return data.path;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Security checks
      if (!fingerprint) {
        throw new Error("Erro de segurança: não foi possível verificar o dispositivo");
      }

      await checkDeviceSecurity(signUpData.email);

      if (signUpData.password !== signUpData.confirmPassword) {
        throw new Error("As senhas não coincidem");
      }

      if (passwordStrength < 60) {
        throw new Error("Senha muito fraca. Use pelo menos 8 caracteres com maiúsculas, minúsculas e números");
      }

      if (!signUpData.profilePhoto || !signUpData.documentPhoto) {
        throw new Error("Foto de perfil e documento são obrigatórios para verificação");
      }

      // Upload photos first
      const profilePhotoPath = await uploadFile(signUpData.profilePhoto, "pages", "profiles/");
      const documentPhotoPath = await uploadFile(signUpData.documentPhoto, "pages", "documents/");

      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: signUpData.nome,
            username: signUpData.nomeUsuario,
            genero: signUpData.genero,
            profile_photo_url: profilePhotoPath,
            document_photo_url: documentPhotoPath,
            uuid_code: signUpData.uuid,
            device_fingerprint: fingerprint.id,
          },
        },
      });

      if (error) throw error;

      setUserEmail(signUpData.email);
      setShowOtpInput(true);
      toast({
        title: "Conta criada com sucesso!",
        description: "Código de verificação enviado para seu email.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!fingerprint) {
        throw new Error("Erro de segurança: não foi possível verificar o dispositivo");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      // Update device fingerprint in database
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ 
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.user.id);
      }

      navigate("/");
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao Thibis!",
      });
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: otpCode,
        type: 'signup'
      });

      if (error) throw error;

      toast({
        title: "Conta verificada com sucesso!",
        description: "Bem-vindo ao Thibis! Sua jornada segura começa agora.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro na verificação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'document') => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 20MB",
          variant: "destructive",
        });
        return;
      }

      setSignUpData(prev => ({
        ...prev,
        [type === 'profile' ? 'profilePhoto' : 'documentPhoto']: file
      }));

      toast({
        title: "Arquivo carregado",
        description: `${type === 'profile' ? 'Foto de perfil' : 'Documento'} selecionado com sucesso`,
      });
    }
  };

  if (fpLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <Card className="p-8 backdrop-blur-sm bg-white/10 border-white/20">
          <div className="text-center space-y-4">
            <Fingerprint className="w-12 h-12 text-white mx-auto animate-pulse" />
            <p className="text-white font-medium">Verificando segurança do dispositivo...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (deviceBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/10 border-red-500/30">
          <CardHeader className="text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              Dispositivo Bloqueado
            </CardTitle>
            <CardDescription className="text-white/80">
              Este dispositivo já possui uma conta registrada. Por segurança, apenas uma conta por dispositivo é permitida.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-3 text-sm text-white/70">
              <p className="flex items-center justify-center gap-2">
                <Fingerprint className="w-4 h-4" />
                Para sua segurança, detectamos:
              </p>
              <div className="bg-white/5 p-3 rounded-lg space-y-1">
                <p className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  ID do Dispositivo: {fingerprint?.id}
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Globe className="w-4 h-4" />
                  Sistema: {fingerprint?.platform}
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Resolução: {fingerprint?.screenResolution}
                </p>
              </div>
              <p className="mt-4">Entre com sua conta existente ou use outro dispositivo.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showOtpInput) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
        <Card className="w-full max-w-md backdrop-blur-lg bg-white/10 border-white/20 shadow-elegant">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Mail className="w-10 h-10 text-white animate-pulse" />
            </div>
            <CardTitle className="text-white text-2xl font-bold flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              Verificar Email
            </CardTitle>
            <CardDescription className="text-white/80 text-base">
              Código enviado para <strong>{userEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <Label htmlFor="otp" className="text-white font-medium flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Código de Verificação
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center text-xl font-mono tracking-widest"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-white text-primary hover:bg-white/90 font-bold py-3 shadow-glow" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verificar Conta
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-lg backdrop-blur-lg bg-white/10 border-white/20 shadow-elegant">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-white text-3xl font-bold">Thibis</CardTitle>
          <CardDescription className="text-white/80 text-lg">
            Conecte-se com máxima segurança
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
              <TabsTrigger 
                value="signin" 
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Cadastrar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div>
                  <Label htmlFor="signin-email" className="text-white font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData(prev => ({...prev, email: e.target.value}))}
                    className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password" className="text-white font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Senha
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({...prev, password: e.target.value}))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-white/70 hover:text-white hover:bg-white/10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-white text-primary hover:bg-white/90 font-bold py-3 shadow-glow" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Zap className="w-4 w-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Entrar no Thibis
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-6">
                {/* Step 1: Photos */}
                {signUpStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-white font-medium flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Foto de Perfil
                      </Label>
                      <div className="mt-2">
                        <Input
                          id="profile-photo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'profile')}
                          className="hidden"
                          required
                        />
                        <Label 
                          htmlFor="profile-photo" 
                          className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-white/20 rounded-lg px-4 py-6 text-white hover:border-white/40 hover:bg-white/5 transition-all"
                        >
                          <Upload className="h-6 w-6" />
                          <div>
                            {signUpData.profilePhoto ? (
                              <span className="text-green-300 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {signUpData.profilePhoto.name}
                              </span>
                            ) : (
                              <span>Escolher sua foto de perfil</span>
                            )}
                          </div>
                        </Label>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Documento de Identidade
                      </Label>
                      <div className="mt-2">
                        <Input
                          id="document-photo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'document')}
                          className="hidden"
                          required
                        />
                        <Label 
                          htmlFor="document-photo" 
                          className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-white/20 rounded-lg px-4 py-6 text-white hover:border-white/40 hover:bg-white/5 transition-all"
                        >
                          <Shield className="h-6 w-6" />
                          <div>
                            {signUpData.documentPhoto ? (
                              <span className="text-green-300 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {signUpData.documentPhoto.name}
                              </span>
                            ) : (
                              <span>BI, Passaporte ou Cartão do Cidadão</span>
                            )}
                          </div>
                        </Label>
                      </div>
                      <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Segurança máxima - necessário para verificação
                      </p>
                    </div>

                    <Button 
                      type="button"
                      onClick={() => setSignUpStep(2)}
                      disabled={!signUpData.profilePhoto || !signUpData.documentPhoto}
                      className="w-full bg-white text-primary hover:bg-white/90 font-bold py-3 shadow-glow"
                    >
                      Continuar
                    </Button>
                  </div>
                )}

                {/* Step 2: Personal Info */}
                {signUpStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="nome" className="text-white font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nome Completo
                      </Label>
                      <Input
                        id="nome"
                        type="text"
                        value={signUpData.nome}
                        onChange={(e) => setSignUpData(prev => ({...prev, nome: e.target.value}))}
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="nome-usuario" className="text-white font-medium flex items-center gap-2">
                        <AtSign className="w-4 h-4" />
                        Nome de Usuário
                      </Label>
                      <Input
                        id="nome-usuario"
                        type="text"
                        value={signUpData.nomeUsuario}
                        onChange={(e) => setSignUpData(prev => ({...prev, nomeUsuario: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')}))}
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="seuusuario123"
                        pattern="[a-zA-Z0-9_]+"
                        title="Apenas letras, números e underscore"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-white font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Gênero
                      </Label>
                      <Select value={signUpData.genero} onValueChange={(value) => setSignUpData(prev => ({...prev, genero: value}))}>
                        <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Selecione seu gênero" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setSignUpStep(1)}
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        Voltar
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => setSignUpStep(3)}
                        disabled={!signUpData.nome || !signUpData.nomeUsuario || !signUpData.genero}
                        className="flex-1 bg-white text-primary hover:bg-white/90 font-bold shadow-glow"
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Email & Password */}
                {signUpStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="signup-email" className="text-white font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData(prev => ({...prev, email: e.target.value}))}
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="signup-password" className="text-white font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Senha (mín. 8 caracteres)
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          value={signUpData.password}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-12"
                          placeholder="••••••••"
                          minLength={8}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 text-white/70 hover:text-white hover:bg-white/10"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {signUpData.password && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-white/70 mb-1">
                            <span>Força da senha</span>
                            <span>{passwordStrength}%</span>
                          </div>
                          <Progress 
                            value={passwordStrength} 
                            className="h-2 bg-white/10"
                          />
                          <div className="text-xs text-white/60 mt-1">
                            {passwordStrength < 40 && (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Muito fraca
                              </span>
                            )}
                            {passwordStrength >= 40 && passwordStrength < 70 && (
                              <span className="flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Média
                              </span>
                            )}
                            {passwordStrength >= 70 && (
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Forte
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirm-password" className="text-white font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Confirmar Senha
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData(prev => ({...prev, confirmPassword: e.target.value}))}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-12"
                          placeholder="••••••••"
                          minLength={8}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 text-white/70 hover:text-white hover:bg-white/10"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {signUpData.confirmPassword && signUpData.password !== signUpData.confirmPassword && (
                        <p className="text-xs text-red-300 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Senhas não coincidem
                        </p>
                      )}
                    </div>

                    {/* Device Security Info */}
                    {fingerprint && (
                      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Fingerprint className="w-4 h-4 text-green-300" />
                          <span className="text-sm font-medium text-white">Dispositivo Seguro</span>
                        </div>
                        <div className="text-xs text-white/60 space-y-1">
                          <p>ID: {fingerprint.id}</p>
                          <p>UUID da Conta: {signUpData.uuid}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setSignUpStep(2)}
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        Voltar
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-white text-primary hover:bg-white/90 font-bold shadow-glow" 
                        disabled={isLoading || passwordStrength < 60}
                      >
                        {isLoading ? (
                          <>
                            <Zap className="w-4 w-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4 mr-2" />
                            Criar Conta
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;