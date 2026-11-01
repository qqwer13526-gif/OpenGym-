import json, platform, subprocess
from pathlib import Path
result = {'python':platform.python_version(), 'platform':platform.platform()}
try:
    result['nvidia_smi'] = subprocess.check_output(['nvidia-smi','--query-gpu=name,driver_version,memory.total','--format=csv,noheader'],text=True).strip()
except Exception as e:
    result['nvidia_error'] = str(e)
try:
    import torch
    result.update(torch=torch.__version__, torch_cuda=torch.version.cuda, cuda_available=torch.cuda.is_available())
    if torch.cuda.is_available():
        result['gpu']=torch.cuda.get_device_name(0)
        result['capability']=torch.cuda.get_device_capability(0)
        x=torch.ones((256,256),device='cuda')
        y=x@x
        torch.cuda.synchronize()
        result['cuda_matmul_passed']=bool((y==256).all().item())
except Exception as e:
    result['torch_error']=str(e)
path=Path(__file__).resolve().parents[1]/'reports/environment.json'
path.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
