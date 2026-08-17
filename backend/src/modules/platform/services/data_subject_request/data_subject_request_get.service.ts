import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getObjectStorage } from '../../../../shared/storage/index.js';
import { PATIENT_PACKAGE_PRESIGN_TTL_SECONDS } from '../../helpers/patient_package_storage.helper.js';
import { DataSubjectRequestNotFoundError } from '../../models/errors/data_subject_request.errors.js';
import { GetRepository } from '../../repositories/data_subject_request/data_subject_request_get.repository.js';
import { toDataSubjectRequestView } from '../../repositories/data_subject_request/mappers/data_subject_request.mapper.js';
import type { DataSubjectRequestView } from '../../types/data_subject_request/data_subject_request.types.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, dsrId: string): Promise<DataSubjectRequestView> {
    const row = await this.get.execute(ctx, dsrId);
    if (!row) throw new DataSubjectRequestNotFoundError();

    let exportUrl: string | null = null;
    let expiresIn: number | null = null;
    if (row.exportKey) {
      const signed = await getObjectStorage().presignGet(
        row.exportKey,
        PATIENT_PACKAGE_PRESIGN_TTL_SECONDS,
      );
      exportUrl = signed.url;
      expiresIn = PATIENT_PACKAGE_PRESIGN_TTL_SECONDS;
    }

    return toDataSubjectRequestView(row, { exportUrl, expiresIn });
  }
}
