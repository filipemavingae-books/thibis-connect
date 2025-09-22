import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nome: "",
    nomeUsuario: "",
    genero: "",
    profilePhoto: null as File | null,
    documentPhoto: null as File | null,
  });

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !showOtpInput) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, showOtpInput]);

  const uploadFile = async (file: File, bucket: string, folder: string = "") => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}${Date.now()}.${fileExt}`;
    
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
      if (signUpData.password !== signUpData.confirmPassword) {
        throw new Error("As senhas não coincidem");
      }

      if (signUpData.password.length < 8) {
        throw new Error("A senha deve ter pelo menos 8 caracteres");
      }

      if (!signUpData.profilePhoto || !signUpData.documentPhoto) {
        throw new Error("Foto de perfil e documento são obrigatórios");
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
          },
        },
      });

      if (error) throw error;

      setUserEmail(signUpData.email);
      setShowOtpInput(true);
      toast({
        title: "Código enviado!",
        description: "Verifique seu email para o código de verificação.",
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      navigate("/");
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
        title: "Conta verificada!",
        description: "Bem-vindo ao Thibis!",
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
      setSignUpData(prev => ({
        ...prev,
        [type === 'profile' ? 'profilePhoto' : 'documentPhoto']: file
      }));
    }
  };

  if (showOtpInput) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
            <CardTitle>Verificar Email</CardTitle>
            <CardDescription>
              Digite o código enviado para {userEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp">Código de Verificação</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verificando..." : "Verificar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Thibis</CardTitle>
          <CardDescription>Conecte-se com segurança</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData(prev => ({...prev, email: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({...prev, password: e.target.value}))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="profile-photo">Foto de Perfil*</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="profile-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'profile')}
                      className="hidden"
                    />
                    <Label htmlFor="profile-photo" className="flex items-center gap-2 cursor-pointer border border-input rounded-md px-3 py-2 text-sm">
                      <Upload className="h-4 w-4" />
                      {signUpData.profilePhoto ? signUpData.profilePhoto.name : "Escolher foto"}
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="nome">Nome Completo*</Label>
                  <Input
                    id="nome"
                    type="text"
                    value={signUpData.nome}
                    onChange={(e) => setSignUpData(prev => ({...prev, nome: e.target.value}))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="nome-usuario">Nome de Usuário*</Label>
                  <Input
                    id="nome-usuario"
                    type="text"
                    value={signUpData.nomeUsuario}
                    onChange={(e) => setSignUpData(prev => ({...prev, nomeUsuario: e.target.value}))}
                    pattern="[a-zA-Z0-9_]+"
                    title="Apenas letras, números e underscore"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="genero">Gênero*</Label>
                  <Select value={signUpData.genero} onValueChange={(value) => setSignUpData(prev => ({...prev, genero: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="document-photo">Foto do Documento*</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="document-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'document')}
                      className="hidden"
                    />
                    <Label htmlFor="document-photo" className="flex items-center gap-2 cursor-pointer border border-input rounded-md px-3 py-2 text-sm">
                      <Upload className="h-4 w-4" />
                      {signUpData.documentPhoto ? signUpData.documentPhoto.name : "Escolher documento"}
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-email">Email*</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData(prev => ({...prev, email: e.target.value}))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="signup-password">Senha* (mín. 8 caracteres)</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({...prev, password: e.target.value}))}
                      minLength={8}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirmar Senha*</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(prev => ({...prev, confirmPassword: e.target.value}))}
                      minLength={8}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;