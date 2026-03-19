import { useState } from "react";
import { useAccount } from "wagmi";
import { useCreateStream, useCreateMultiStream } from "@/hooks/useTokenStream";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { USDC_LOGO, USDC_SYMBOL, isValidAddress, toDurationSeconds, getExplorerUrl, INTERVAL_OPTIONS } from "@/lib/contracts";
import { AppHeader, AppFooter } from "@/components/AppLayout";

export default function CreateStreamPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <div className="flex-1 max-w-[1400px] mx-auto px-6 py-8 w-full">
        <div className="mb-8">
          <h1 className="font-mono-display text-3xl font-bold text-foreground tracking-tighter mb-2">
            CREATE STREAM
          </h1>
          <p className="text-muted-foreground">
            Fund a new token stream to a beneficiary. Tokens will drip over time.
          </p>
        </div>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="single">Single Stream</TabsTrigger>
            <TabsTrigger value="multi">Multi Stream</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single">
            <SingleStreamForm />
          </TabsContent>
          
          <TabsContent value="multi">
            <MultiStreamForm />
          </TabsContent>
        </Tabs>
      </div>
      <AppFooter />
    </div>
  );
}

function SingleStreamForm() {
  const { address, isConnected } = useAccount();
  const { createStream, isPending, isConfirming, isConfirmed, txHash, error } = useCreateStream();
  
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState<"seconds" | "minutes" | "hours" | "days">("days");
  const [interval, setInterval] = useState<number>(3600);
  const [createdStreamId, setCreatedStreamId] = useState<string | null>(null);

  const durationSeconds = toDurationSeconds(parseFloat(durationValue) || 0, durationUnit);
  const intervalError = interval > durationSeconds && durationSeconds > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }
    
    if (!isValidAddress(beneficiary)) {
      toast.error("Invalid beneficiary address");
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    
    const numDuration = parseFloat(durationValue);
    if (isNaN(numDuration) || numDuration <= 0) {
      toast.error("Invalid duration");
      return;
    }
    
    if (interval > durationSeconds) {
      toast.error("Unlock frequency cannot exceed total duration");
      return;
    }
    
    const duration = BigInt(durationSeconds);
    
    createStream(beneficiary as `0x${string}`, amount, duration, BigInt(interval));
  };

  if (isConfirmed && txHash) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="font-mono-display text-xl font-bold text-foreground">STREAM CREATED</h2>
            <p className="text-muted-foreground">Your stream has been successfully created.</p>
            {createdStreamId && (
              <div className="mt-4 p-4 bg-muted rounded">
                <p className="label-micro mb-2">STREAM ID</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono-display text-primary">{createdStreamId}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(createdStreamId)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4">
              <a
                href={getExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View Transaction <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <Button
              onClick={() => {
                window.location.reload();
              }}
              className="mt-4"
            >
              Create Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Single Stream</CardTitle>
        <CardDescription>Create a stream to a single beneficiary</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Beneficiary Address</label>
            <Input
              placeholder="0x..."
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              Amount
              <img src={USDC_LOGO} alt="USDC" className="w-4 h-4 rounded-full" />
              <span className="text-muted-foreground font-normal">{USDC_SYMBOL}</span>
            </label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Duration</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                placeholder="30"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                className="font-mono flex-1"
              />
              <Select
                value={durationUnit}
                onValueChange={(v) => setDurationUnit(v as typeof durationUnit)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Seconds</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Unlock Frequency</label>
            <Select
              value={interval.toString()}
              onValueChange={(v) => setInterval(Number(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {intervalError && (
              <p className="text-xs text-red-500 mt-1">
                Unlock frequency cannot exceed total duration
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">
              {error.message || "Transaction failed"}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || isConfirming || !isConnected}
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isPending ? "Waiting for wallet..." : "Confirming..."}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Stream
              </>
            )}
          </Button>

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to create a stream
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

interface BeneficiaryRow {
  id: string;
  address: string;
  percentage: string;
}

function MultiStreamForm() {
  const { address, isConnected } = useAccount();
  const { createMultiStream, isPending, isConfirming, isConfirmed, txHash, error } = useCreateMultiStream();
  
  const [totalAmount, setTotalAmount] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState<"seconds" | "minutes" | "hours" | "days">("days");
  const [interval, setInterval] = useState<number>(3600);
  const [distributionMode, setDistributionMode] = useState<"even" | "custom">("even");
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryRow[]>([
    { id: "1", address: "", percentage: "" },
    { id: "2", address: "", percentage: "" },
  ]);
  const [createdStreamIds, setCreatedStreamIds] = useState<string[]>([]);

  const addBeneficiary = () => {
    if (beneficiaries.length >= 1000) {
      toast.error("Maximum 1000 beneficiaries allowed");
      return;
    }
    setBeneficiaries([...beneficiaries, { id: crypto.randomUUID(), address: "", percentage: "" }]);
  };

  const removeBeneficiary = (id: string) => {
    if (beneficiaries.length <= 1) return;
    setBeneficiaries(beneficiaries.filter(b => b.id !== id));
  };

  const updateBeneficiary = (id: string, field: "address" | "percentage", value: string) => {
    setBeneficiaries(beneficiaries.map(b => 
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  const totalPercentage = beneficiaries.reduce((sum, b) => {
    const pct = parseFloat(b.percentage) || 0;
    return sum + pct;
  }, 0);

  const durationSeconds = toDurationSeconds(parseFloat(durationValue) || 0, durationUnit);
  const intervalError = interval > durationSeconds && durationSeconds > 0;

  const isValid = () => {
    if (!isConnected) return false;
    
    const numAmount = parseFloat(totalAmount);
    if (isNaN(numAmount) || numAmount <= 0) return false;
    
    const numDuration = parseFloat(durationValue);
    if (isNaN(numDuration) || numDuration <= 0) return false;
    
    if (interval > durationSeconds) return false;
    
    for (const b of beneficiaries) {
      if (!isValidAddress(b.address)) return false;
      if (distributionMode === "custom") {
        const pct = parseFloat(b.percentage);
        if (isNaN(pct) || pct < 0 || pct > 100) return false;
      }
    }
    
    if (distributionMode === "custom" && Math.abs(totalPercentage - 100) > 0.01) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid()) {
      toast.error("Please fill in all fields correctly");
      return;
    }
    
    const validAddresses = beneficiaries
      .map(b => b.address)
      .filter(addr => isValidAddress(addr)) as `0x${string}`[];
    
    if (validAddresses.length === 0) {
      toast.error("At least one valid beneficiary address is required");
      return;
    }
    
    const duration = BigInt(durationSeconds);
    
    let percentages: bigint[] = [];
    if (distributionMode === "custom") {
      percentages = beneficiaries
        .filter(b => isValidAddress(b.address))
        .map(b => BigInt(Math.round(parseFloat(b.percentage) * 100)));
    }
    
    createMultiStream(validAddresses, totalAmount, duration, BigInt(interval), percentages);
  };

  if (isConfirmed && txHash) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="font-mono-display text-xl font-bold text-foreground">MULTI STREAM CREATED</h2>
            <p className="text-muted-foreground">Your {createdStreamIds.length} streams have been created.</p>
            {createdStreamIds.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded max-h-48 overflow-y-auto">
                <p className="label-micro mb-2">STREAM IDS</p>
                <div className="space-y-1">
                  {createdStreamIds.map((id, i) => (
                    <div key={id} className="flex items-center justify-center gap-2">
                      <span className="font-mono-display text-sm text-primary">{id}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4">
              <a
                href={getExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View Transaction <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <Button
              onClick={() => {
                window.location.reload();
              }}
              className="mt-4"
            >
              Create Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Multi Stream</CardTitle>
        <CardDescription>Distribute tokens to multiple beneficiaries at once</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Total Amount
                <img src={USDC_LOGO} alt="USDC" className="w-4 h-4 rounded-full" />
                <span className="text-muted-foreground font-normal">{USDC_SYMBOL}</span>
              </label>
              <Input
                type="number"
                step="0.000001"
                min="0"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="30"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  className="font-mono flex-1"
                />
                <Select
                  value={durationUnit}
                  onValueChange={(v) => setDurationUnit(v as typeof durationUnit)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unlock Frequency</label>
              <Select
                value={interval.toString()}
                onValueChange={(v) => setInterval(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {intervalError && (
                <p className="text-xs text-red-500 mt-1">
                  Unlock frequency cannot exceed total duration
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Distribution Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="distribution"
                  checked={distributionMode === "even"}
                  onChange={() => setDistributionMode("even")}
                  className="accent-primary"
                />
                <span className="text-sm">Even Split</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="distribution"
                  checked={distributionMode === "custom"}
                  onChange={() => setDistributionMode("custom")}
                  className="accent-primary"
                />
                <span className="text-sm">Custom Percentages</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Beneficiaries</label>
              <Button type="button" variant="outline" size="sm" onClick={addBeneficiary}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {beneficiaries.map((b, index) => (
                <div key={b.id} className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                  <Input
                    placeholder="0x..."
                    value={b.address}
                    onChange={(e) => updateBeneficiary(b.id, "address", e.target.value)}
                    className="font-mono flex-1"
                  />
                  {distributionMode === "custom" && (
                    <div className="flex items-center gap-1 w-28">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={b.percentage}
                        onChange={(e) => updateBeneficiary(b.id, "percentage", e.target.value)}
                        className="font-mono w-20"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                  {distributionMode === "even" && (
                    <span className="text-sm text-muted-foreground w-20 text-right">
                      {(100 / beneficiaries.length).toFixed(2)}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeBeneficiary(b.id)}
                    disabled={beneficiaries.length <= 1}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {distributionMode === "custom" && (
              <div className={`text-sm font-medium ${Math.abs(totalPercentage - 100) < 0.01 ? "text-green-500" : "text-red-500"}`}>
                Total: {totalPercentage.toFixed(2)}% 
                {Math.abs(totalPercentage - 100) < 0.01 ? " ✓" : " (must equal 100%)"}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">
              {error.message || "Transaction failed"}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || isConfirming || !isConnected || !isValid()}
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isPending ? "Waiting for wallet..." : "Confirming..."}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Multi Stream ({beneficiaries.length} streams)
              </>
            )}
          </Button>

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to create streams
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
